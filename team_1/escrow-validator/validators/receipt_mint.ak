use aiken/collection/dict
use aiken/collection/list
use cardano/address.{Script}
use cardano/assets.{PolicyId}
use cardano/transaction.{Input, Transaction}

validator receipt_mint(escrow_script_hash: ByteArray) {
  mint(_redeemer: Data, policy_id: PolicyId, self: Transaction) {
    let spends_escrow =
      list.any(
        self.inputs,
        fn(input: Input) {
          input.output.address.payment_credential == Script(
            escrow_script_hash,
          )
        },
      )

    let minted_assets = assets.tokens(self.mint, policy_id)

    // Ensure we are only minting tokens, not burning them
    let mints_only_positive =
      dict.size(minted_assets) > 0 && list.all(
        dict.values(minted_assets),
        fn(qty) { qty > 0 },
      )

    spends_escrow && mints_only_positive
  }

  else(_) {
    fail
  }
}
