
import zxcvbn from 'zxcvbn';

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const result = zxcvbn(password);
  const errors: string[] = [];

  if (result.score < 3) {
    if (result.feedback.warning) {
      errors.push(result.feedback.warning);
    }
    result.feedback.suggestions.forEach(suggestion => {
      errors.push(suggestion);
    });
    if (errors.length === 0) {
      errors.push("Password is too weak. Please choose a stronger password.");
    }
  }

  return {
    isValid: result.score >= 3,
    errors
  };
}