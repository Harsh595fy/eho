import React from 'react';

export const LOGO_SMALL = '/eho-logo-192.png';
export const LOGO_LARGE = '/eho-logo.png';

/** The official EHO circular logo. */
export default function BrandLogo({size = 46, large = false, className = ''}) {
 return <img className={`brand-logo ${className}`.trim()} src={large ? LOGO_LARGE : LOGO_SMALL} width={size} height={size} alt="EHO — Ethical Hacking Organizations logo" decoding="async" />;
}
