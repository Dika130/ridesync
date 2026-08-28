export interface PhoneIntelligence {
  formattedNumber: string;
  isValid: boolean;
  operator: string;
  region: string;
  cardType: 'Prepaid' | 'Postpaid' | 'Unknown';
  networkType: 'GSM 4G/5G' | 'CDMA' | 'VoIP' | 'Fixed Line';
}

export function lookupPhoneNumber(phone: string): PhoneIntelligence {
  let cleaned = phone.trim().replace(/[^0-9+]/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '+62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+') && cleaned.startsWith('62')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+') && cleaned.length >= 9) {
    cleaned = '+62' + cleaned;
  }

  const localPart = cleaned.replace(/^\+62/, '0');
  const prefix4 = localPart.substring(0, 4);

  let operator = 'Operator Indonesia';
  let region = 'Nasional';
  let cardType: 'Prepaid' | 'Postpaid' | 'Unknown' = 'Prepaid';
  let networkType: 'GSM 4G/5G' | 'CDMA' | 'VoIP' | 'Fixed Line' = 'GSM 4G/5G';
  let isValid = localPart.length >= 10 && localPart.length <= 14;

  if (['0811'].includes(prefix4)) {
    operator = 'Telkomsel (Halo)';
    cardType = 'Postpaid';
  } else if (['0812', '0813', '0821', '0822'].includes(prefix4)) {
    operator = 'Telkomsel (SimPATI)';
  } else if (['0851', '0852', '0853', '0823'].includes(prefix4)) {
    operator = 'Telkomsel (By.U / AS)';
  } else if (['0814', '0815', '0816', '0855'].includes(prefix4)) {
    operator = 'Indosat (Matrix / IM3)';
  } else if (['0856', '0857', '0858'].includes(prefix4)) {
    operator = 'Indosat (IM3 Ooredoo)';
  } else if (['0895', '0896', '0897', '0898', '0899'].includes(prefix4)) {
    operator = 'Indosat (Tri Indonesia)';
  } else if (['0817', '0818', '0819', '0859', '0877', '0878'].includes(prefix4)) {
    operator = 'XL Axiata (XL Prepaid)';
  } else if (['0831', '0832', '0833', '0838'].includes(prefix4)) {
    operator = 'XL Axiata (AXIS)';
  } else if (['0881', '0882', '0883', '0884', '0885', '0886', '0887', '0888', '0889'].includes(prefix4)) {
    operator = 'Smartfren (4G LTE)';
  }

  const subPrefix = localPart.substring(0, 6);
  if (['08121', '08122', '08128', '08131', '08138', '08571', '08180'].some(p => subPrefix.startsWith(p))) {
    region = 'Jabodetabek & Banten';
  } else if (['08122', '08132', '08562', '08172', '08182'].some(p => subPrefix.startsWith(p))) {
    region = 'Jawa Barat (Bandung & Sekitarnya)';
  } else if (['08123', '08133', '08563', '08173', '08183'].some(p => subPrefix.startsWith(p))) {
    region = 'Jawa Timur (Surabaya & Sekitarnya)';
  } else if (['08124', '08134', '08564', '08174'].some(p => subPrefix.startsWith(p))) {
    region = 'Jawa Tengah & DIY';
  } else if (['08126', '08136', '08566', '08176'].some(p => subPrefix.startsWith(p))) {
    region = 'Sumatera';
  } else if (['08125', '08135', '08565', '08175'].some(p => subPrefix.startsWith(p))) {
    region = 'Kalimantan & Bali';
  }

  return { formattedNumber: cleaned, isValid, operator, region, cardType, networkType };
}
