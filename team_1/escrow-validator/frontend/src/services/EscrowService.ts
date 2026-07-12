import { Lucid, TxHash, Constr, Data, applyParamsToScript, fromText } from "lucid-cardano";

// ── Compiled contracts from plutus.json ──────────────────────────────────────
const ESCROW_COMPILED_CODE =
  "59040001010029800aba2aba1aba0aab9faab9eaab9dab9a488888896600264653001300800198041804800cdc3a400530080024888966002600460106ea800e26466453001159800980098059baa0028cc004c030dd5180798061baa002919198008009bac301130123012301230123012301230123012300e375400c44b30010018a508acc004cdc79bae30120010038a518998010011809800a01a4041223232330010010042259800800c00e26464b30013372200c00315980099b8f00600189bab3013002802a022899802002180b801a022375c60220026028002809052f5bded8c1300b375400e911119191919194c004c8cc88cc008008004896600200314a11325980099b90001004899801801980e80144cdc7802000a02e375c602e603600280c8cc020dd5980c980d180d180d180d180b1baa00e375c6032603400466e28cdc51bae3018009489015f0032598009805800c5220109636f6d706c65746564008acc004c03c006291106726566756e64008acc004c03cc054dd5180c980b1baa0118a4410c6661766f725f73656c6c6572008a450b6661766f725f627579657200405080a1014180a1baa0109119198008009bac301b301c301c3018375402044b30010018a508acc004c96600266ebcc074c068dd5180e980d1baa0013374a90001980e1ba90054bd7044cdc480219199119801001000912cc004006007132325980099b91489000018acc004cdc7a4410000189bad301f002802a03a8998020021811801a03a375c603a002604000280f0cc034dd5980f180f980d9baa002489001480022941018180e000c528c4cc008008c07400501720349bae30180059bae30180049bad301800248888966002601e0171598009806801c566002601a00515980099802001000c40162941018452820308a5040611598009809805c566002601a007159800992cc004c050c068dd5000c4cdc49bad301e007375a603c60366ea80062941019180e980d1baa301d301a3754603a603c603c603c603c603c603c603c60346ea804a2b3001330040030018802c52820308a50406114a080c2264b30013014301a3754603c60366ea805a2b30010018acc004cc01400c00a200d14a080ca29410194566002003159800998028020014401a2941019452820324064601a6eb8c0740210182030180c000980b800980b000980a800980a00222c805260166ea801e601e0069112cc004c01000a2b3001300f37540150038b20208acc004c02000a2b3001300f37540150038b20208acc004cdc3a40080051323259800980a80140162c8090c966002602200315980099b8948010c0400062d1300a3010001403d1640486ea8c04c004c03cdd500545900d201a4034300d300e001370e900018049baa0038b200e180400098019baa0088a4d13656400401";

const MINT_BASE_COMPILED_CODE =
  "590178010100229800aba2aba1aba0aab9faab9eaab9dab9a9bae0024888888896600264653001300900198049805000cc0240092225980099b8748000c020dd500144c8c96600264660020026eb0c03cc030dd5002112cc00400629422b30013375e6020601a6ea8c040c034dd51808180898069baa30100013374a9001198079ba900a4bd704528c4cc008008c04400500b201c8acc004cdc424000646600200200444b30010018a40011337009001198010011808800a01c899198008009919800800801912cc004006297ae089980818071808800998010011809000a01e2259800800c528c56600266e212000375a602000313300200230110018a50402c80722941009452820123232330010013756601e602060206020602060186ea80108966002003003899192cc004cdc8803000c56600266e3c01800626eacc03c00a00a806a26600800860260068068dd718068009808000a01c14bd6f7b6301bae300c3009375400516401c300900130043754013149a26cac8011";

// Escrow script hash (from plutus.json) — used to parameterize the minting policy
const ESCROW_SCRIPT_HASH = "5793a9b0a3a96285aea060774f2f598210a055c1a56c6934f56064bb";
// ─────────────────────────────────────────────────────────────────────────────

export class EscrowService {
  private lucid: Lucid;

  // Escrow spending validator (no constructor parameters)
  private escrowScript = {
    type: "PlutusV3" as const,
    script: ESCROW_COMPILED_CODE,
  };

  // Minting policy is parameterized with the escrow script hash
  private mintingPolicy = {
    type: "PlutusV3" as const,
    script: applyParamsToScript(MINT_BASE_COMPILED_CODE, [ESCROW_SCRIPT_HASH]),
  };

  constructor(lucid: Lucid) {
    this.lucid = lucid;
  }

  getEscrowAddress(): string {
    return this.lucid.utils.validatorToAddress(this.escrowScript as any);
  }

  getPolicyId(): string {
    return this.lucid.utils.mintingPolicyToId(this.mintingPolicy as any);
  }

  async createEscrow(
    sellerAddress: string,
    arbiterAddress: string,
    amountLovelace: bigint,
    deadlinePosix: bigint
  ): Promise<TxHash> {
    const buyerAddress = await this.lucid.wallet.address();
    const buyerPkh = this.lucid.utils.getAddressDetails(buyerAddress).paymentCredential?.hash;
    const sellerPkh = this.lucid.utils.getAddressDetails(sellerAddress).paymentCredential?.hash;
    const arbiterPkh = this.lucid.utils.getAddressDetails(arbiterAddress).paymentCredential?.hash;

    if (!buyerPkh || !sellerPkh || !arbiterPkh) {
      throw new Error("Invalid address: could not extract payment credential hash.");
    }

    // Unique escrow ID as hex-encoded UTF-8 bytes (matches bytearray in Aiken)
    const escrowId = fromText(Math.random().toString(36).substring(2, 10));
    const policyId = this.getPolicyId();

    // Datum matching EscrowDatum in types.ak (constructor index 0, 7 fields)
    const datum = Data.to(
      new Constr(0, [escrowId, buyerPkh, sellerPkh, arbiterPkh, amountLovelace, deadlinePosix, policyId])
    );

    const tx = await this.lucid
      .newTx()
      .payToContract(this.getEscrowAddress(), { inline: datum }, { lovelace: amountLovelace })
      .complete();

    const signed = await tx.sign().complete();
    return signed.submit();
  }

  async releasePayment(escrowUtxo: any): Promise<TxHash> {
    if (!escrowUtxo.datum) throw new Error("UTxO has no inline datum.");

    const datum = Data.from(escrowUtxo.datum) as Constr<Data>;
    const [escrowId, , sellerPkh, , amount, , policyId] = datum.fields as [
      string, string, string, string, bigint, bigint, string
    ];

    // Token name = escrow_id bytes + "_completed" — mirrors escrow.ak logic
    const tokenName = escrowId + fromText("_completed");

    // Release = constructor index 0, no fields
    const redeemer = Data.to(new Constr(0, []));

    const sellerAddr = this.lucid.utils.credentialToAddress({
      type: "Key",
      hash: sellerPkh,
    });

    const tx = await this.lucid
      .newTx()
      .collectFrom([escrowUtxo], redeemer)
      .attachSpendingValidator(this.escrowScript as any)
      .attachMintingPolicy(this.mintingPolicy as any)
      .mintAssets({ [`${policyId}${tokenName}`]: 1n }, redeemer)
      .payToAddress(sellerAddr, { lovelace: amount })
      .addSigner(await this.lucid.wallet.address())
      .complete();

    const signed = await tx.sign().complete();
    return signed.submit();
  }
}
