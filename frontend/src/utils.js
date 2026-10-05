export function fullName(user) {
    if (!user) return 'Unknown';
    return [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .map(capitalizeWords)
        .join(' ');
}

export function initials(user) {
    if (!user) return '?';
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
}

export function capitalizeFirstLetter(value) {
    if (typeof value !== 'string') return value;

    return value.replace(/^(\s*)(\p{L})/u, (_, whitespace, letter) => `${whitespace}${letter.toUpperCase()}`);
}

export function capitalizeWords(value) {
    if (typeof value !== 'string') return value;

    return value
        .toLowerCase()
        .replace(/(^|[\s'-])(\p{L})/gu, (_, separator, letter) => `${separator}${letter.toUpperCase()}`);
}

export function formatDate(value, withTime = true) {
    if (!value) return '—';

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    });
}

export function placeholderDisplay(category) {
    const categoryMap = {
        'All': '/placeholders/all.png',
        'General': '/placeholders/general.png',
        'Clothing': '/placeholders/clothing.png',
        'Electronics': '/placeholders/electronics.png',
        'Home & Living': '/placeholders/homeAndLiving.png',
        'Food': '/placeholders/food.png',
        'Accessories': '/placeholders/accessories.png',
    };

    if (!category || typeof category !== 'string') {
        return '/placeholder/all.png';
    }

    const key = category.trim();
    return categoryMap[key] || '/placeholder/all.png';
}