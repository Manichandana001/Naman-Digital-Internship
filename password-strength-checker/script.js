document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('passwordInput');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const criteriaList = document.getElementById('criteriaList');

    passwordInput.addEventListener('input', function() {
        const password = passwordInput.value;
        const strength = checkPasswordStrength(password);
        updateUI(strength);
    });

    function checkPasswordStrength(password) {
        let score = 0;
        const criteria = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
            commonPattern: !hasCommonPattern(password)
        };

        // Update criteria list
        document.getElementById('lengthCriteria').className = criteria.length ? 'valid' : 'invalid';
        document.getElementById('uppercaseCriteria').className = criteria.uppercase ? 'valid' : 'invalid';
        document.getElementById('lowercaseCriteria').className = criteria.lowercase ? 'valid' : 'invalid';
        document.getElementById('numberCriteria').className = criteria.number ? 'valid' : 'invalid';
        document.getElementById('specialCharCriteria').className = criteria.specialChar ? 'valid' : 'invalid';
        document.getElementById('commonPatternCriteria').className = criteria.commonPattern ? 'valid' : 'invalid';

        // Calculate score
        if (criteria.length) score++;
        if (criteria.uppercase) score++;
        if (criteria.lowercase) score++;
        if (criteria.number) score++;
        if (criteria.specialChar) score++;
        if (criteria.commonPattern) score++;

        return score;
    }

    function hasCommonPattern(password) {
        const commonPatterns = [
            'password', '123456', 'qwerty', 'abc123', 'password123', 'admin', 'letmein', 'welcome'
        ];
        const lowerPassword = password.toLowerCase();

        // Check for exact matches
        if (commonPatterns.includes(lowerPassword)) return true;

        // Check for sequences (e.g., abc, 123)
        if (/(.)\1{2,}/.test(lowerPassword)) return true; // Repeated chars
        if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/.test(lowerPassword)) return true;
        if (/123|234|345|456|567|678|789|890/.test(lowerPassword)) return true;

        return false;
    }

    function updateUI(score) {
        let strength = '';
        let color = '';
        let width = '';

        if (score <= 2) {
            strength = 'Weak';
            color = 'red';
            width = '33%';
        } else if (score <= 4) {
            strength = 'Medium';
            color = 'orange';
            width = '66%';
        } else {
            strength = 'Strong';
            color = 'green';
            width = '100%';
        }

        strengthBar.style.width = width;
        strengthBar.style.backgroundColor = color;
        strengthText.textContent = `Strength: ${strength}`;
    }
});
