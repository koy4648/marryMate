import type { ReactNode } from 'react'
import { FloralSwag } from './Ornaments'
import { formatWon, paymentAmountLabel, summarizePayments, type Payment } from '../features/budget/budget'
import { itemQuote } from '../features/budget/estimates'
import { statusLabel, type PlanningItem } from '../features/planning/planning'

const mealTypes=[{name:'상견례 식사',icon:'❧',description:'양가가 처음 함께하는 자리'},{name:'상견례 선물',icon:'♡',description:'감사한 마음을 담은 작은 준비'},{name:'청첩장 모임',icon:'☕',description:'소중한 사람들에게 전하는 소식'}]
export function Meals({items,payments,sortControls,onAdd,onEdit,onPayments}:{items:PlanningItem[];payments:Payment[];sortControls:ReactNode;onAdd:(name:string)=>void;onEdit:(item:PlanningItem)=>void;onPayments:(item:PlanningItem)=>void}) {
  const active=items.filter(item=>item.status!=='SKIPPED')
  const total=active.reduce((sum,item)=>sum+itemQuote(item,[]),0)
  return <section className="page-section meals-page">
    <div className="page-title"><div><p className="eyebrow">AROUND OUR TABLE</p><h1>마음을 나누는 식사</h1><p>가족과의 첫 만남부터 친구들과의 약속까지, 한 자리씩 준비해요.</p></div><button className="primary" onClick={()=>onAdd('청첩장 모임')}>＋ 식사·모임 추가</button></div>
    <div className="meal-starters">{mealTypes.map(type=><button key={type.name} onClick={()=>onAdd(type.name)}><span aria-hidden="true">{type.icon}</span><div><strong>{type.name}</strong><small>{type.description}</small></div><b aria-hidden="true">＋</b></button>)}</div>
    <div className="meal-overview"><span>{active.length}개의 식사·선물 기록</span><strong>예상 비용 {formatWon(total)}</strong></div>
    {sortControls}
    {!active.length?<div className="meal-empty"><FloralSwag/><h2>함께할 자리를 하나씩 담아봐요</h2><p>장소와 날짜, 식사비와 선물 비용을 따로 기록할 수 있어요.<br/>청첩장 제작·인쇄·발송은 준비 체크에서 관리해요.</p></div>:<div className="meal-grid">{active.map(item=>{
      const linked=payments.filter(payment=>payment.planningItemId===item.id&&payment.status!=='CANCELLED')
      const summary=summarizePayments(linked)
      const cost=itemQuote(item,[])
      return <article className="meal-card" key={item.id}><button className="meal-card-content" onClick={()=>onEdit(item)}><div className="meal-card-heading"><span>{item.itemName}</span><small>{item.status==='CONTRACTED'?'예약·구매 확정':statusLabel[item.status]}</small></div><h2>{item.vendorName||'장소·구입처를 정해볼까요?'}</h2><p className="meal-date">{item.scheduleDate?`${item.scheduleDate.replaceAll('-','.')} ${item.scheduleTime?.slice(0,5)??''}`:'날짜는 아직 미정이에요'}</p><div className="meal-card-cost"><strong>{cost?formatWon(cost):'예산 미입력'}</strong>{paymentAmountLabel(summary)&&<small>{paymentAmountLabel(summary)}</small>}</div>{item.memo&&<p className="meal-memo">{item.memo}</p>}</button><div className="meal-card-actions"><button className="text-button" onClick={()=>onEdit(item)}>내용 수정</button><button className="secondary" disabled={!item.vendorName||cost<=0} onClick={()=>onPayments(item)}>예산·결제 관리</button></div></article>
    })}</div>}
  </section>
}
