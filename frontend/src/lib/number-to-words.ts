/**
 * Chuyển đổi số tiền thành chữ tiếng Việt chuẩn kế toán.
 * Ví dụ: 1500000 -> "Một triệu năm trăm nghìn đồng chẵn"
 */

const DIGITS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

function readGroup(group: number, showZeroHundred = false): string {
  const hundreds = Math.floor(group / 100);
  const tens = Math.floor((group % 100) / 10);
  const ones = group % 10;
  const parts: string[] = [];

  if (hundreds > 0 || showZeroHundred) {
    parts.push(`${DIGITS[hundreds]} trăm`);
  }

  if (tens === 0) {
    if (ones > 0 && (hundreds > 0 || showZeroHundred)) {
      parts.push("lẻ");
      parts.push(DIGITS[ones]);
    } else if (ones > 0) {
      parts.push(DIGITS[ones]);
    }
  } else if (tens === 1) {
    parts.push("mười");
    if (ones === 1) parts.push("một");
    else if (ones === 5) parts.push("lăm");
    else if (ones > 0) parts.push(DIGITS[ones]);
  } else {
    parts.push(`${DIGITS[tens]} mươi`);
    if (ones === 1) parts.push("mốt");
    else if (ones === 4) parts.push("tư");
    else if (ones === 5) parts.push("lăm");
    else if (ones > 0) parts.push(DIGITS[ones]);
  }

  return parts.join(" ");
}

export function numberToVietnameseWords(amount: number): string {
  if (amount === 0) return "Không đồng chẵn";
  if (amount < 0) return `Âm ${numberToVietnameseWords(Math.abs(amount))}`;

  const integerAmount = Math.round(amount);
  const scales = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

  let num = integerAmount;
  const groups: number[] = [];

  while (num > 0) {
    groups.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupVal = groups[i];
    if (groupVal === 0) continue;

    const showZeroHundred = i < groups.length - 1;
    const groupWords = readGroup(groupVal, showZeroHundred);
    const scale = scales[i];

    if (groupWords) {
      words.push(groupWords);
      if (scale) words.push(scale);
    }
  }

  const result = words.join(" ").replace(/\s+/g, " ").trim();
  // Capitalize first letter and append "đồng chẵn"
  const formatted = result.charAt(0).toUpperCase() + result.slice(1);
  return `${formatted} đồng chẵn`;
}
