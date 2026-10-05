import { BloodRequest, Donor, DonorMatchResult } from '../types';
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
  return diffDays;
}

export function isEligibleByDonationTiming(lastDonationDate: string | null): boolean {
  const days = getDaysSinceLastDonation(lastDonationDate);
  if (days === null) return true; // No record of recent donation
  return days >= 90; // Standard 90 days whole blood interval
}

export interface MatchFilterOptions {
  verifiedOnly?: boolean;
  availableOnly?: boolean;
  maxDistanceKm?: number;
}

/**
 * Deterministic, explainable smart donor matching function.
 * Evaluates donors against blood request requirements and returns ranked results.
 */
export function matchDonors(
  request: BloodRequest,
  donors: Donor[],
  options: MatchFilterOptions = {}
): DonorMatchResult[] {
  const results: DonorMatchResult[] = [];

  for (const donor of donors) {
    // Suspended donors are strictly excluded
    if (donor.status === 'Suspended' || donor.verificationStatus === 'SUSPENDED') {
      continue;
    }

    // 1. Blood Compatibility Check (Absolute requirement)
    const compatible = isCompatible(donor.bloodGroup, request.requiredBloodGroup);
    if (!compatible) {
      continue; // Filter out incompatible donors
    }

    const compatInfo = getCompatibilityDetails(donor.bloodGroup, request.requiredBloodGroup);

    // 2. Verification check
    const isVerified = donor.verificationStatus === 'VERIFIED';
    if (options.verifiedOnly && !isVerified) {
      continue;
    }

    // 3. Availability check
    const isAvailable = donor.status === 'Available' || donor.status === 'Verified';
    if (options.availableOnly && !isAvailable) {
      continue;
    }

    // 4. Distance Calculation
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

    // 5. Recent donation eligibility
    const daysSinceLast = getDaysSinceLastDonation(donor.lastDonationDate);
    const isTimingEligible = isEligibleByDonationTiming(donor.lastDonationDate);

    // 6. Calculate Explainable Score (0 - 100)
    let score = 0;
    const reasons: string[] = [];

    // Verification Score (up to 30 pts)
    if (isVerified) {
      score += 30;
      reasons.push('Verified donor');
    } else {
      score += 10;
      reasons.push('Pending verification (caution advised)');
    }

    // Compatibility Bonus (up to 20 pts)
    if (compatInfo.isExactMatch) {
      score += 20;
      reasons.push(`Exact ABO/Rh match (${donor.bloodGroup})`);
    } else if (compatInfo.isUniversalDonor) {
      score += 18;
      reasons.push('Universal O- RBC donor');
    } else {
      score += 15;
      reasons.push(`Compatible group (${donor.bloodGroup})`);
    }

    // Availability Score (up to 25 pts)
    if (donor.status === 'Available') {
      score += 25;
      reasons.push('Available now');
    } else if (donor.status === 'Verified') {
      score += 20;
      reasons.push('Active profile');
    } else if (donor.status === 'Recently Donated' || !isTimingEligible) {
      score += 5;
      reasons.push(`Recently donated (${daysSinceLast ?? '< 90'} days ago – resting period required)`);
    } else if (donor.status === 'Temporarily Unavailable') {
      score += 5;
      reasons.push('Marked temporarily unavailable');
    }

    // Emergency Availability Score (up to 15 pts)
    if (request.urgency === 'EMERGENCY' || request.urgency === 'URGENT') {
      if (donor.emergencyAvailable) {
        score += 15;
        reasons.push('Emergency on-call volunteer');
      } else {
        score += 5;
      }
    } else {
      if (donor.emergencyAvailable) {
        score += 5;
      }
    }

    // Proximity / Distance Score (up to 25 pts)
    if (distanceKm !== null) {
      if (distanceKm <= 5) {
        score += 25;
        reasons.push(`Very close (${distanceKm} km away)`);
      } else if (distanceKm <= 15) {
        score += 20;
        reasons.push(`Nearby (${distanceKm} km away)`);
      } else if (distanceKm <= 30) {
        score += 14;
        reasons.push(`Within reach (${distanceKm} km away)`);
      } else if (distanceKm <= 50) {
        score += 8;
        reasons.push(`${distanceKm} km away`);
      } else {
        score += 3;
        reasons.push(`${distanceKm} km away`);
      }
    } else {
      // Fallback district/city check
      if (
        donor.district &&
        request.hospitalLocation.district &&
        donor.district.toLowerCase() === request.hospitalLocation.district.toLowerCase()
      ) {
        score += 15;
        reasons.push(`Same District (${donor.district})`);
      } else {
        score += 8;
        reasons.push(distanceDisplay);
      }
    }

    // Profile Completeness & Donation Interval (up to 10 pts)
    if (donor.profileCompleteness >= 90) {
      score += 5;
    }
    if (isTimingEligible && donor.lastDonationDate) {
      score += 5;
      reasons.push(`Last donated ${daysSinceLast} days ago (Medically eligible timing)`);
    } else if (!donor.lastDonationDate) {
      score += 5;
      reasons.push('First-time / No recent donation logged');
    }

    // Normalize max score to 100
    const finalScore = Math.min(100, Math.max(10, Math.round(score)));

    // Prepend BEST MATCH badge if top tier
    if (finalScore >= 85 && isVerified && isAvailable) {
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
