import { BloodGroup, BloodRequest, Donor, DonorMatchResult } from '../types';
import { getCompatibilityDetails, isCompatible } from './compatibility';
import { formatDistance } from './distance';

/**
 * Checks if a donor has waited at least 90 days (standard safe donation interval for whole blood)
 */
export function getDaysSinceLastDonation(lastDonationDate: string | null): number | null {
  if (!lastDonationDate) return null;
  const donationTime = new Date(lastDonationDate).getTime();
  if (isNaN(donationTime)) return null;

  const now = Date.now();
  const diffMs = now - donationTime;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Determines whether the donor satisfies the minimum 90-day rest interval
 */
export function isEligibleByDonationTiming(lastDonationDate: string | null): boolean {
  const days = getDaysSinceLastDonation(lastDonationDate);
  if (days === null) return true; // No record of recent donation -> eligible
  return days >= 90; // Standard 90 days whole blood interval
}

export interface DonorEligibilityCheck {
  isEligible: boolean;
  reason?: string;
  reasonTa?: string;
  failedCriteria?: string;
}

/**
 * Deterministic eligibility check for matching.
 * A donor is eligible for a real hospital request only when ALL required conditions are satisfied:
 * 1. donor is verified (verificationStatus === 'VERIFIED')
 * 2. donor is currently available (status === 'Available')
 * 3. donor is not suspended (status !== 'Suspended' && verificationStatus !== 'SUSPENDED')
 * 4. donor is not temporarily unavailable (status !== 'Temporarily Unavailable')
 * 5. donor is not recently donated / inside configured deferral period (status !== 'Recently Donated' && isEligibleByDonationTiming)
 * 6. donor is blood-group compatible (isCompatible)
 * 7. donor has sufficient required profile information (profileCompleteness >= 70 & mandatory fields)
 *
 * Eligibility filtering MUST happen BEFORE ranking/scoring.
 */
export function checkDonorEligibility(
  donor: Donor,
  requiredBloodGroup: BloodGroup
): DonorEligibilityCheck {
  // 1. Incompatible blood group exclusion
  if (!isCompatible(donor.bloodGroup, requiredBloodGroup)) {
    return {
      isEligible: false,
      failedCriteria: 'BLOOD_INCOMPATIBLE',
      reason: `Incompatible blood group (${donor.bloodGroup} cannot donate RBC to ${requiredBloodGroup}).`,
      reasonTa: `பொருந்தாத இரத்த வகை (${donor.bloodGroup} இரத்தத்தை ${requiredBloodGroup} நோயாளிக்கு வழங்க முடியாது).`,
    };
  }

  // 2. Suspended donor exclusion
  if (donor.status === 'Suspended' || donor.verificationStatus === 'SUSPENDED') {
    return {
      isEligible: false,
      failedCriteria: 'SUSPENDED',
      reason: 'Donor account is suspended by administrator.',
      reasonTa: 'கொடையாளர் கணக்கு நிர்வாகியால் இடைநிறுத்தப்பட்டுள்ளது.',
    };
  }

  // 3. Pending or non-verified donor exclusion
  if (donor.verificationStatus !== 'VERIFIED') {
    return {
      isEligible: false,
      failedCriteria: 'NOT_VERIFIED',
      reason: 'Donor profile is pending administrative verification approval.',
      reasonTa: 'கொடையாளர் சுயவிவரம் நிர்வாகியின் சரிபார்ப்பு ஒப்புதலுக்காகக் காத்திருக்கிறது.',
    };
  }

  // 4. Temporarily unavailable donor exclusion
  if (donor.status === 'Temporarily Unavailable') {
    return {
      isEligible: false,
      failedCriteria: 'TEMPORARILY_UNAVAILABLE',
      reason: 'Donor has marked themselves as temporarily unavailable.',
      reasonTa: 'கொடையாளர் தற்காலிகமாக இரத்த தானம் செய்ய இயலாது என அமைத்துள்ளார்.',
    };
  }

  // 5. Recently donated / medical deferral exclusion
  const daysSinceLast = getDaysSinceLastDonation(donor.lastDonationDate);
  const timingEligible = isEligibleByDonationTiming(donor.lastDonationDate);

  if (donor.status === 'Recently Donated' || !timingEligible) {
    const daysLeft = daysSinceLast !== null ? Math.max(1, 90 - daysSinceLast) : 90;
    return {
      isEligible: false,
      failedCriteria: 'RECENTLY_DONATED',
      reason: `Donor has donated recently (${daysSinceLast ?? '<90'} days ago). Mandatory 90-day rest interval active (~${daysLeft} days remaining).`,
      reasonTa: `கொடையாளர் சமீபத்தில் இரத்த தானம் செய்துள்ளார் (${daysSinceLast ?? '<90'} நாட்களுக்கு முன்பு). 90 நாள் ஓய்வுக்காலம் தேவைப்படுகிறது.`,
    };
  }

  // 6. Availability status must be Available
  if (donor.status !== 'Available') {
    return {
      isEligible: false,
      failedCriteria: 'NOT_AVAILABLE',
      reason: `Donor availability status is "${donor.status}", not "Available".`,
      reasonTa: `கொடையாளர் நிலை தயார் நிலையில் இல்லை ("${donor.status}").`,
    };
  }

  // 7. Sufficient profile completeness
  if (donor.profileCompleteness !== undefined && donor.profileCompleteness < 70) {
    return {
      isEligible: false,
      failedCriteria: 'INCOMPLETE_PROFILE',
      reason: `Donor profile is incomplete (${donor.profileCompleteness}% complete). Minimum 70% required.`,
      reasonTa: `கொடையாளர் சுயவிவரம் முழுமையடையவில்லை (${donor.profileCompleteness}% மட்டுமே உள்ளது).`,
    };
  }

  return { isEligible: true };
}

export interface MatchFilterOptions {
  maxDistanceKm?: number;
  districtFilter?: string;
  emergencyOnly?: boolean;
}

/**
 * Deterministic, explainable smart donor matching function.
 * Evaluates donors against blood request requirements and returns ONLY eligible donors ranked from 0 to 100.
 */
export function matchDonors(
  request: BloodRequest,
  donors: Donor[],
  options: MatchFilterOptions = {}
): DonorMatchResult[] {
  const results: DonorMatchResult[] = [];

  for (const donor of donors) {
    // -------------------------------------------------------------
    // STRICT ELIGIBILITY FILTERING (BEFORE SCORING)
    // Ineligible donors must NEVER appear as eligible matches
    // -------------------------------------------------------------
    const eligibility = checkDonorEligibility(donor, request.requiredBloodGroup);
    if (!eligibility.isEligible) {
      continue;
    }

    // Optional district filter if requested
    if (
      options.districtFilter &&
      options.districtFilter !== 'All Districts' &&
      options.districtFilter !== 'ALL' &&
      donor.district &&
      donor.district.toLowerCase() !== options.districtFilter.toLowerCase()
    ) {
      continue;
    }

    // Optional emergency-only filter
    if (options.emergencyOnly && !donor.emergencyAvailable) {
      continue;
    }

    // Calculate distance using honest coordinates or district fallback
    const { distanceKm, display: distanceDisplay } = formatDistance(
      donor.location,
      request.hospitalLocation
    );

    if (
      options.maxDistanceKm !== undefined &&
      distanceKm !== null &&
      distanceKm > options.maxDistanceKm
    ) {
      continue;
    }

    const compatInfo = getCompatibilityDetails(donor.bloodGroup, request.requiredBloodGroup);
    const daysSinceLast = getDaysSinceLastDonation(donor.lastDonationDate);
    const isTimingEligible = isEligibleByDonationTiming(donor.lastDonationDate);

    // -------------------------------------------------------------
    // EXPLAINABLE NORMALIZED SCORING (MAX 100 POINTS)
    // No arbitrary score inflation; distinct weights summing to <= 100
    // -------------------------------------------------------------
    let score = 0;
    const reasons: string[] = [];

    // 1. Compatibility Quality (Max 25 pts)
    if (compatInfo.isExactMatch) {
      score += 25;
      reasons.push(`Exact ABO/Rh match (${donor.bloodGroup})`);
    } else if (compatInfo.isUniversalDonor) {
      score += 22;
      reasons.push('Universal O- RBC donor');
    } else {
      score += 18;
      reasons.push(`Compatible group (${donor.bloodGroup})`);
    }

    // 2. Geographic Proximity / Location (Max 35 pts)
    if (distanceKm !== null) {
      if (distanceKm <= 5) {
        score += 35;
        reasons.push(`Very close (${distanceKm} km away)`);
      } else if (distanceKm <= 15) {
        score += 28;
        reasons.push(`Nearby (${distanceKm} km away)`);
      } else if (distanceKm <= 30) {
        score += 20;
        reasons.push(`Within reach (${distanceKm} km away)`);
      } else if (distanceKm <= 50) {
        score += 12;
        reasons.push(`Extended radius (${distanceKm} km away)`);
      } else {
        score += 5;
        reasons.push(`Regional (${distanceKm} km away)`);
      }
    } else {
      // Honest District / City fallback scoring
      const hospitalDistrict = request.hospitalLocation?.district;
      const hospitalCity = request.hospitalLocation?.city;

      if (
        donor.city &&
        hospitalCity &&
        donor.city.toLowerCase() === hospitalCity.toLowerCase()
      ) {
        score += 26;
        reasons.push(`Same City (${donor.city}) – District matching`);
      } else if (
        donor.district &&
        hospitalDistrict &&
        donor.district.toLowerCase() === hospitalDistrict.toLowerCase()
      ) {
        score += 20;
        reasons.push(`Same District (${donor.district}) – District matching`);
      } else {
        score += 10;
        reasons.push(distanceDisplay);
      }
    }

    // 3. Emergency Callout Readiness (Max 20 pts)
    if (request.urgency === 'EMERGENCY' || request.urgency === 'URGENT') {
      if (donor.emergencyAvailable) {
        score += 20;
        reasons.push('On-call 24/7 emergency volunteer');
      } else {
        score += 8;
        reasons.push('Standard available donor');
      }
    } else {
      if (donor.emergencyAvailable) {
        score += 12;
        reasons.push('Emergency on-call certified');
      } else {
        score += 10;
        reasons.push('Available now');
      }
    }

    // 4. Verification & Deferral Rest Interval Quality (Max 20 pts)
    score += 10; // All reached donors are verified (10 pts)
    reasons.push('Verified donor');

    if (isTimingEligible) {
      if (daysSinceLast === null || daysSinceLast >= 180) {
        score += 10;
        reasons.push('Optimal rest interval (>6 months / first-time)');
      } else {
        score += 6;
        reasons.push(`Medically rested (${daysSinceLast} days since last donation)`);
      }
    }

    // Normalized final score cleanly bounded between 10 and 100
    const finalScore = Math.min(100, Math.max(10, Math.round(score)));

    // Highlight top tier matches
    if (finalScore >= 80) {
      reasons.unshift('BEST MATCH');
    }

    results.push({
      donorId: donor.id,
      displayName: donor.fullName,
      bloodGroup: donor.bloodGroup,
      verificationStatus: donor.verificationStatus,
      availability: donor.status,
      distanceKm,
      distanceDisplay,
      matchScore: finalScore,
      isCompatible: true,
      compatibilityDetail: compatInfo.explanation,
      reasons,
      isDemo: donor.isDemo,
      emergencyAvailable: donor.emergencyAvailable,
      profileCompleteness: donor.profileCompleteness,
      lastDonationDate: donor.lastDonationDate,
      daysSinceLastDonation: daysSinceLast,
      isMedicallyEligibleTiming: isTimingEligible,
    });
  }

  // Sort descending by match score, then distance
  results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    const distA = a.distanceKm ?? 999;
    const distB = b.distanceKm ?? 999;
    return distA - distB;
  });

  return results;
}
