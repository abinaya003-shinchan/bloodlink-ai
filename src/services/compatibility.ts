import { BloodGroup } from '../types';

/**
 * Standard ABO/Rh Red Blood Cell Compatibility Matrix
 * Keys are Recipient blood groups, values are arrays of compatible Donor blood groups.
 */
export const RBC_COMPATIBILITY_MATRIX: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

/**
 * Reusable deterministic compatibility function.
 * Matches packed Red Blood Cell (RBC) compatibility.
 * NOT dependent on Generative AI.
 */
export function isCompatible(
  donorBloodGroup: string | BloodGroup,
  recipientBloodGroup: string | BloodGroup
): boolean {
  const recipient = recipientBloodGroup as BloodGroup;
  const donor = donorBloodGroup as BloodGroup;

  const compatibleDonors = RBC_COMPATIBILITY_MATRIX[recipient];
  if (!compatibleDonors) {
    return false;
  }
  return compatibleDonors.includes(donor);
}

/**
 * Returns all compatible donor blood groups for a given recipient blood group.
 */
export function getCompatibleDonorBloodGroups(recipientBloodGroup: BloodGroup): BloodGroup[] {
  return RBC_COMPATIBILITY_MATRIX[recipientBloodGroup] || [];
}

/**
 * Medical disclaimer required for all matching outputs.
 */
export const MEDICAL_DISCLAIMER_EN =
  'BloodLink AI is an automated donor identification and matching aid. Final blood compatibility, donor eligibility, antibody screening, crossmatching, and clinical decisions must be confirmed by qualified healthcare professionals and the hospital blood bank.';

export const MEDICAL_DISCLAIMER_TA =
  'பிளட்லிங்க் AI (BloodLink AI) என்பது தானியங்கி கொடையாளர் அடையாளம் காணும் மற்றும் பொருத்தும் உதவி மட்டுமே. இறுதி இரத்தப் பொருத்தம், கொடையாளர் தகுதி, ஆன்டிபாடி பரிசோதனை, கிராஸ்மேட்சிங் மற்றும் மருத்துவ முடிவுகள் தகுதிவாய்ந்த சுகாதார நிபுணர்கள் மற்றும் மருத்துவமனை இரத்த வங்கியால் உறுதிப்படுத்தப்பட வேண்டும்.';

/**
 * Detailed explanation of why donor and recipient are or are not compatible.
 */
export function getCompatibilityDetails(donor: BloodGroup, recipient: BloodGroup): {
  compatible: boolean;
  explanation: string;
  isExactMatch: boolean;
  isUniversalDonor: boolean;
  isUniversalRecipient: boolean;
} {
  const compatible = isCompatible(donor, recipient);
  const isExactMatch = donor === recipient;
  const isUniversalDonor = donor === 'O-';
  const isUniversalRecipient = recipient === 'AB+';

  if (!compatible) {
    return {
      compatible: false,
      explanation: `Incompatible: Donor blood group ${donor} contains antigens that will cause hemolytic transfusion reaction in ${recipient} recipient.`,
      isExactMatch: false,
      isUniversalDonor,
      isUniversalRecipient,
    };
  }

  if (isExactMatch) {
    return {
      compatible: true,
      explanation: `Exact ABO/Rh match (${donor} to ${recipient}). Primary choice for transfusion.`,
      isExactMatch: true,
      isUniversalDonor,
      isUniversalRecipient,
    };
  }

  if (isUniversalDonor) {
    return {
      compatible: true,
      explanation: `Compatible: Donor is O- (Universal RBC Donor) safe for ${recipient} recipient when group-specific blood is unavailable.`,
      isExactMatch: false,
      isUniversalDonor: true,
      isUniversalRecipient,
    };
  }

  if (isUniversalRecipient) {
    return {
      compatible: true,
      explanation: `Compatible: Recipient is AB+ (Universal RBC Recipient) and can safely receive ${donor} red blood cells.`,
      isExactMatch: false,
      isUniversalDonor: false,
      isUniversalRecipient: true,
    };
  }

  return {
    compatible: true,
    explanation: `Compatible: Donor ${donor} red blood cells lack opposing antigens for recipient ${recipient}.`,
    isExactMatch: false,
    isUniversalDonor: false,
    isUniversalRecipient: false,
  };
}
