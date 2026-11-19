export function venueContractTotal(mealPrice:number,guarantee:number,rentalFee:number) {
  if (![mealPrice,guarantee,rentalFee].every(value=>Number.isSafeInteger(value)&&value>=0) || guarantee>2147483647) throw new Error('식대·보증인원·대관료를 0 이상의 정수로 입력해 주세요.')
  const total=mealPrice*guarantee+rentalFee
  if(!Number.isSafeInteger(total)||total>999999999999999) throw new Error('웨딩홀 총액은 15자리 이하로 입력해 주세요.')
  return total
}
export function venueBalance(total:number,deposit:number,interim:number) {
  const balance=total-deposit-interim
  if(balance<0) throw new Error('계약금과 중도금 합계가 웨딩홀 총액보다 커요. 금액을 확인해 주세요.')
  return balance
}

export function venueGiftEstimate(mealPrice:number,guarantee:number) {
  return venueContractTotal(mealPrice,guarantee,0)
}
