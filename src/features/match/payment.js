// 회비/참가비 정산 — 토스 송금 딥링크 기반 (가맹 등록 불필요)
//
// 토스 송금 딥링크: supertoss://send?bank=<은행명>&accountNo=<계좌>&amount=<금액>&msg=<메모>
// 모바일에서 클릭 시 토스 앱이 열리며 송금 화면이 자동 입력됨.
// 토스 앱 미설치 환경은 동작하지 않으므로 PWA(모바일) 가 주 사용처.

export const BANK_OPTIONS = [
  '카카오뱅크',
  '토스뱅크',
  '신한',
  '국민',
  '우리',
  '하나',
  '농협',
  '기업',
  '새마을',
  '신협',
  '우체국',
  'SC제일',
  '씨티',
  '케이뱅크'
];

const LAST_BANK_KEY = 'matchup.lastBankAccount';

export function getLastBankAccount() {
  try {
    const raw = localStorage.getItem(LAST_BANK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function rememberBankAccount({ bank, accountNo, holderName }) {
  try {
    localStorage.setItem(
      LAST_BANK_KEY,
      JSON.stringify({ bank, accountNo, holderName })
    );
  } catch {
    /* ignore */
  }
}

// 1인당 정산 금액 — 총액 ÷ 정산 인원, 100원 단위 올림.
export function computePerPerson(totalCost, splitCount) {
  if (!totalCost || !splitCount) return 0;
  const raw = totalCost / splitCount;
  return Math.ceil(raw / 100) * 100;
}

// 토스 송금 딥링크. holderName 은 토스가 URL 에서 받지 않지만, msg에 살짝 묶어 보냄.
export function buildTossLink({ bank, accountNo, amount, memo }) {
  const params = new URLSearchParams();
  params.set('bank', bank);
  params.set('accountNo', String(accountNo).replace(/\s/g, ''));
  if (amount) params.set('amount', String(amount));
  if (memo) params.set('msg', memo);
  return `supertoss://send?${params.toString()}`;
}

export function formatWon(amount) {
  if (typeof amount !== 'number') return '0원';
  return `${amount.toLocaleString('ko-KR')}원`;
}
