export const sanitizeSubdomain = (input: string): string => {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+|-+$/g, '');
};

export const formatPhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
};

export const buildStoreUrl = (subdomain: string, rootDomain: string): string => {
    return `${subdomain}.${rootDomain}`;
};