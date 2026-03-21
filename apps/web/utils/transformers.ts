export const sanitizeSubdomain = (input: string): string => {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, '');
};

export const formatPhoneNumber = (phone: string): string => {
    phone = phone.replace(/\D/g, '');
    return phone;
};

export const buildStoreUrl = (subdomain: string, _rootDomain: string): string => {
    return `/${subdomain}`;
};