use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{PolicyId}

pub type EscrowDatum {
  escrow_id: ByteArray,
  buyer: VerificationKeyHash,
  seller: VerificationKeyHash,
  arbiter: VerificationKeyHash,
  amount: Int,
  deadline: Int,
  receipt_policy: PolicyId,
}

pub type EscrowRedeemer {
  Release
  Refund
  Resolve { favor_seller: Bool }
}
