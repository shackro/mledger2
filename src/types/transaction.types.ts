export type TransactionType =
  | 'SEND_MONEY'
  | 'RECEIVE_MONEY'
  | 'LIPA_NA_MPESA'
  | 'WITHDRAW'
  | 'DEPOSIT'
  | 'AIRTIME'
  | 'PAYBILL'
  | 'FULIZA_WITHDRAW'
  | 'FULIZA_REPAY'

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED'
