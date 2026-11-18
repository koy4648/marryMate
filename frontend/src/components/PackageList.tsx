import type { PlanningItem } from '../features/planning/planning'
import type { Payment } from '../features/budget/budget'
import { formatWon } from '../features/budget/budget'
import { statusLabel } from '../features/planning/planning'

export function PackageList({ packages, onOpen, onAdd }: {
  packages: PlanningItem[]; onOpen: (id: number) => void; onAdd: () => void
}) {
  return <section className="page-section"><div className="page-title"><div><p className="eyebrow">우리의 묶음 계약</p><h1>패키지 관리</h1><p>등록한 패키지를 눌러 포함 항목과 계약 내용을 확인하세요.</p></div><button className="secondary" onClick={onAdd}>＋ 패키지 추가</button></div>
    <div className="package-list">{packages.map(item => <button key={item.id} className="package-overview" onClick={() => onOpen(item.id)}>
      <span className="eyebrow">{statusLabel[item.status]}</span><h2>{item.vendorName || item.itemName}</h2>{item.vendorName && <p>{item.itemName}</p>}
      <div className="package-tags">{item.packageIncludedItems.split('|').filter(Boolean).map(label => <span key={label}>{label}</span>)}</div>
      <div className="package-overview-footer"><strong>{formatWon(item.quotedAmount)}</strong><span>포함 항목 보기 →</span></div><small>예산에 패키지 총액 한 번만 반영</small>
    </button>)}</div>{!packages.length && <p className="empty">등록한 패키지가 없어요. 패키지를 추가하면 포함 항목을 준비 목록에 함께 연결해요.</p>}
  </section>
}

export function PackageDetail({ item, includedItems, payments, onClose, onEdit, onOpenItem, onPayments }: {
  item: PlanningItem; includedItems: PlanningItem[]; payments: Payment[]; onClose: () => void;
  onEdit: () => void; onOpenItem: (item: PlanningItem) => void; onPayments: () => void
}) {
  const linked = payments.filter(payment => payment.planningItemId === item.id && payment.status !== 'CANCELLED')
  return <div className="modal-backdrop" onMouseDown={event => { if(event.target===event.currentTarget) onClose() }}><section className="item-editor package-detail" role="dialog" aria-modal="true" aria-label={`${item.vendorName||item.itemName} 포함 항목`}>
    <div className="section-heading"><div><p className="eyebrow">PACKAGE DETAIL</p><h2>{item.vendorName || item.itemName}</h2><p>{item.itemName} · {statusLabel[item.status]}</p></div><button className="icon-button" aria-label="닫기" onClick={onClose}>×</button></div>
    <div className="contract-package-note"><strong>패키지 총액 {formatWon(item.quotedAmount)}</strong><span>기본 {formatWon(item.packageBaseAmount)} + 추가 {formatWon(item.packageAdditionalAmount)}</span><small>포함 항목에는 별도 비용을 더하지 않고 예산에 한 번만 반영해요.</small></div>
    <h3>포함된 항목</h3><p>각 항목은 준비 체크와 업체 비교에서도 확인할 수 있어요.</p>
    <div className="package-detail-items">{includedItems.map(child => <button key={child.id} onClick={() => onOpenItem(child)}><span><small>{child.serviceGroup}</small><strong>{child.itemName}</strong></span><span>패키지 포함 · 상세 보기 →</span></button>)}</div>
    {!includedItems.length && <p className="empty">아직 포함 항목이 없어요. 패키지 수정에서 구성을 선택해 주세요.</p>}
    {item.packageAdditionalDetails && <p className="package-additional-note">추가금 내역 · {item.packageAdditionalDetails}</p>}
    {linked.length>0 && <section className="package-payment-preview"><h3>연결된 결제 일정</h3>{linked.map(payment => <p key={payment.id}><span>{payment.title}</span><strong>{formatWon(payment.scheduledAmount)}</strong><small>{payment.dueDate} · {payment.status==='PAID'?'납입 완료':'예정'}</small></p>)}</section>}
    <div className="identity-actions"><button className="secondary" onClick={onEdit}>패키지 수정</button>{['CONTRACTED','DONE'].includes(item.status) && <button className="primary" onClick={onPayments}>계약금·중도금·잔금 관리</button>}</div>
  </section></div>
}
