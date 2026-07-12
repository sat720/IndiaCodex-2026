use aiken/collection/dict
use aiken/collection/list
use aiken/interval.{Finite}
use aiken/primitive/bytearray
use cardano/address.{VerificationKey}
use cardano/assets
use cardano/transaction.{OutputReference, Transaction}
use trusttrail/types.{
  EscrowDatum, EscrowRedeemer, Refund, Release, Resolve,
}

validator escrow {
  spend(
    datum: Option<EscrowDatum>,
    redeemer: EscrowRedeemer,
    _own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(
      EscrowDatum {
        escrow_id,
        buyer,
        seller,
        arbiter,
        amount,
        deadline,
        receipt_policy,
      },
    ) = datum

    let signed_by = fn(vkh) { list.has(self.extra_signatories, vkh) }

    let pays_to =
      fn(vkh, required_amount) {
        list.any(
          self.outputs,
          fn(out) {
            out.address.payment_credential == VerificationKey(vkh) && assets.lovelace_of(
              out.value,
            ) >= required_amount
          },
        )
      }

    let expected_outcome =
      when redeemer is {
        Release -> "completed"
        Refund -> "refund"
        Resolve { favor_seller: True } -> "favor_seller"
        Resolve { favor_seller: False } -> "favor_buyer"
      }

    let expected_token_name =
      bytearray.concat(escrow_id, "_") |> bytearray.concat(expected_outcome)

    let mints_receipt =
      dict.has_key(assets.tokens(self.mint, receipt_policy), expected_token_name)

    when redeemer is {
      Release ->
        signed_by(buyer) && signed_by(seller) && pays_to(seller, amount) && mints_receipt

      Refund -> {
        let after_deadline =
          when self.validity_range.lower_bound.bound_type is {
            Finite(lower) -> lower >= deadline
            _ -> False
          }
        signed_by(buyer) && after_deadline && pays_to(buyer, amount) && mints_receipt
      }

      Resolve { favor_seller } -> {
        let valid_signature = signed_by(arbiter)
        if favor_seller {
          valid_signature && pays_to(seller, amount) && mints_receipt
        } else {
          valid_signature && pays_to(buyer, amount) && mints_receipt
        }
      }
    }
  }

  else(_) {
    fail
  }
}
