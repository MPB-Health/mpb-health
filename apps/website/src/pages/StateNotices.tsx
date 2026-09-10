import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LandingPage, PageHero, Sheet } from '../components/landing-redesign/page-kit';

const NOTICES: ReadonlyArray<{ state: string; text?: string; washington?: true }> = [
  {
    state: `Alabama Code Title 22-6A-2`,
    text: `Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  {
    state: `Alaska Statute 21.03.021(k)`,
    text: `Notice: The organization coordinating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. Participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive a payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  {
    state: `Arizona Statute 20-122`,
    text: `Notice: The organization facilitating the sharing of medical expenses is not an insurance company and the ministry's guidelines and plan of operation are not an insurance policy. Whether anyone chooses to assist you with your medical bills will be completely voluntary because participants are not compelled by law to contribute toward your medical bills. Therefore, participation in the ministry or a subscription to any of its documents should not be considered to be insurance. Regardless of whether you receive any payment for medical expenses or whether this ministry continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  {
    state: `Arkansas Code 23-60-104.2`,
    text: `Notice: The organization facilitating the sharing of medical expenses is not an insurance company and neither its guidelines nor plan of operation is an insurance policy. If anyone chooses to assist you with your medical bills, it will be totally voluntary because participants are not compelled by law to contribute toward your medical bills. Participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive payment for medical expenses or if this organization continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  {
    state: `Florida Statute 624.1265`,
    text: `Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor its plan of operation is an insurance policy. Membership is not offered through an insurance company, and the organization is not subject to the regulatory requirements or consumer protections of the Florida Insurance Code. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant is compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payments for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  {
    state: `Georgia Statute 33-1-20`,
    text: `Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  {
    state: `Idaho Statute 41-121`,
    text: `Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  {
    state: `Illinois Statute 215-5/4-Class 1-b`,
    text: `Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation constitute or create an insurance policy. Any assistance you receive with your medical bills will be totally voluntary. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Whether or not you receive any payments for medical expenses and whether or not this organization continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  {
    state: `Indiana Code 27-1-2.1`,
    text: `Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor its plan of operation is an insurance policy. Any assistance you receive with your medical bills will be totally voluntary. Neither the organization nor any other participant can be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Whether or not you receive any payments for medical expenses and whether or not this organization continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  {
    state: `Kentucky Revised Statute 304.1-120 (7)`,
    text: `Notice: Under Kentucky law, the religious organization facilitating the sharing of medical expenses is not an insurance company, and its guidelines, plan of operation, or any other document of the religious organization do not constitute or create an insurance policy. Participation in the religious organization or a subscription to any of its documents shall not be considered insurance. Any assistance you receive with your medical bills will be totally voluntary. Neither the organization or any participant shall be compelled by law to contribute toward your medical bills. Whether or not you receive any payments for medical expenses, and whether or not this organization continues to operate, you shall be personally responsible for the payment of your medical bills.`,
  },
  {
    state: `Louisiana Revised Statute Title 22-318,319`,
    text: `Notice: The ministry facilitating the sharing of medical expenses is not an insurance company. Neither the guidelines nor the plan of operation of the ministry constitutes an insurance policy. Financial assistance for the payment of medical expenses is strictly voluntary. Participation in the ministry or a subscription to any publication issued by the ministry shall not be considered as enrollment in any health insurance plan or as a waiver of your responsibility to pay your medical expenses.`,
  },
  {
    state: `Maine Revised Statute Title 24-A, §704, sub-§3`,
    text: `Notice: The organization facilitating the sharing of medical expenses is not an insurance company and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. Participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  {
    state: `Maryland Article 48, Section 1-202(4)`,
    text: `Notice: This publication is not issued by an insurance company nor is it offered through an insurance company. It does not guarantee or promise that your medical bills will be published or assigned to others for payment. No other subscriber will be compelled to contribute toward the cost of your medical bills. Therefore, this publication should never be considered a substitute for an insurance policy. This activity is not regulated by the State Insurance Administration, and your liabilities are not covered by the Life and Health Guaranty Fund. Whether or not you receive any payments for medical expenses and whether or not this entity continues to operate, you are always liable for any unpaid bills.`,
  },
  {
    state: `Michigan Section 550.1867`,
    text: `Notice: Zion HealthShare is not an insurance company and the financial assistance provided through the ministry is not insurance and is not provided through an insurance company. Whether any participant in the ministry chooses to assist another participant who has financial or medical needs is totally voluntary. A participant will not be compelled by law to contribute toward the financial or medical needs of another participant. This document is not a contract of insurance or a promise to pay for the financial or medical needs of a participant by the ministry. A participant who receives assistance from the ministry for his or her financial or medical needs remains personally responsible for the payment of all of his or her medical bills and other obligations incurred in meeting his or her financial or medical needs.`,
  },
  {
    state: `Mississippi Title 83-77-1`,
    text: `Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payment of medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  {
    state: `Missouri Section 376.1750`,
    text: `Notice: This publication is not an insurance company nor is it offered through an insurance company. Whether anyone chooses to assist you with your medical bills will be totally voluntary, as no other subscriber or member will be compelled to contribute toward your medical bills. As such, this publication should never be considered to be insurance. Whether you receive any payments for medical expenses and whether or not this publication continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  {
    state: `Montana Code Annotated 50-4-111`,
    text: `Notice: The health care sharing ministry facilitating the sharing of medical expenses is not an insurance company and does not use insurance agents or pay commissions to insurance agents. The health care sharing ministry's guidelines and plan of operation are not an insurance policy. Without health care insurance, there is no guarantee that you, a fellow member, or any other person who is a party to the health care sharing ministry agreement will be protected in the event of illness or emergency. Regardless of whether you receive any payment for medical expenses or whether the health care sharing ministry terminates, withdraws from the faith-based agreement, or continues to operate, you are always personally responsible for the payment of your own medical bills. If your participation in the health care sharing ministry ends, state law may subject you to a waiting period before you are able to apply for health insurance coverage.`,
  },
  {
    state: `Nebraska Revised Statute Chapter 44-311`,
    text: `IMPORTANT NOTICE. This organization is not an insurance company, and its product should never be considered insurance. If you join this organization instead of purchasing health insurance, you will be considered uninsured. By the terms of this agreement, whether anyone chooses to assist you with your medical bills as a participant of this organization will be totally voluntary, and neither the organization nor any participant can be compelled by law to contribute toward your medical bills. Regardless of whether you receive payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills. This organization is not regulated by the Nebraska Department of Insurance. You should review this organization's guidelines carefully to be sure you understand any limitations that may affect your personal medical and financial needs.`,
  },
  {
    state: `New Hampshire Section 126-V:1`,
    text: `IMPORTANT NOTICE: This organization is not an insurance company, and its product should never be considered insurance. If you join this organization instead of purchasing health insurance, you will be considered uninsured. By the terms of this agreement, whether anyone chooses to assist you with your medical bills as a participant of this organization will be totally voluntary, and neither the organization nor any participant can be compelled by law to contribute toward your medical bills. Regardless of whether you receive payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills. This organization is not regulated by the New Hampshire Insurance Department. You should review this organization's guidelines carefully to be sure you understand any limitations that may affect your personal medical and financial needs.`,
  },
  {
    state: `North Carolina Statute 58-49-12`,
    text: `Notice: The organization facilitating the sharing of medical expenses is not an insurance company and neither its guidelines nor its plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be voluntary. No other participant will be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payment for medical expenses or whether this organization continues to operate, you are always personally liable for the payment of your own medical bills.`,
  },
  {
    state: `Pennsylvania 40 Penn. Statute Section 23(b)`,
    text: `Notice: This publication is not an insurance company nor is it offered through an insurance company. This publication does not guarantee or promise that your medical bills will be published or assigned to others for payment. Whether anyone chooses to pay your medical bills will be totally voluntary. As such, this publication should never be considered a substitute for insurance. Whether you receive any payments for medical expenses and whether or not this publication continues to operate, you are always liable for any unpaid bills.`,
  },
  {
    state: `South Dakota Statute Title 58-1-3.3`,
    text: `Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payments for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  {
    state: `Texas Code Title 8, K, 1681.001`,
    text: `Notice: This health care sharing ministry facilitates the sharing of medical expenses and is not an insurance company, and neither its guidelines nor its plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. As such, participation in the ministry or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payment for medical expenses or whether this ministry continues to operate, you are always personally responsible for the payment of your own medical bills. Complaints concerning this health care sharing ministry may be reported to the office of the Texas attorney general.`,
  },
  {
    state: `Utah Code 07.31.2024`,
    text: `The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  {
    state: `Virginia Code 38.2-6300-6301`,
    text: `Notice: This publication is not insurance, and is not offered through an insurance company. Whether anyone chooses to assist you with your medical bills will be totally voluntary, as no other member will be compelled by law to contribute toward your medical bills. As such, this publication should never be considered to be insurance. Whether you receive any payments for medical expenses and whether or not this publication continues to operate, you are always personally responsible for the payment of your own medical bills.`,
  },
  { state: `Washington`, washington: true },
  {
    state: `Wisconsin Statute 600.01 (1) (b) (9)`,
    text: `ATTENTION: This publication is not issued by an insurance company, nor is it offered through an insurance company. This publication does not guarantee or promise that your medical bills will be published or assigned to others for payment. Whether anyone chooses to pay your medical bills is entirely voluntary. This publication should never be considered a substitute for an insurance policy. Whether or not you receive any payments for medical expenses, and whether or not this publication continues to operate, you are responsible for the payment of your own medical bills.`,
  },
  {
    state: `Wyoming 26.1.104 (a)(v)(C)`,
    text: `Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Any assistance with your medical bills is completely voluntary. No other participant is compelled by law or otherwise to contribute toward your medical bills. Participation in the organization or a subscription to any of its documents shall not be considered to be health insurance and is not subject to the regulatory requirements or consumer protections of the Wyoming insurance code. You are personally responsible for payment of your medical bills regardless of any financial sharing you may receive from the organization for medical expenses. You are also responsible for payment of your medical bills if the organization ceases to exist or ceases to facilitate the sharing of medical expenses.`,
  },
  {
    state: `All states not listed above`,
    text: `NOTICE: Medical Cost Sharing is not insurance or an insurance policy nor is it offered through an insurance company. Medical Cost Sharing is not a discount healthcare program nor a discount health card program. Whether anyone chooses to assist you with your medical bills will be totally voluntary, as neither the Medical Cost Sharing Community nor any other member is liable for or may be compelled to make the payment of your medical bill. As such, Medical Cost Sharing should never be considered to be insurance. Whether you receive any amounts for medical expenses and whether or not a Medical Cost Sharing Organization continues to operate, you are always personally responsible for the payment of your own medical bills. Medical Cost Sharing is not subject to the regulatory requirements or consumer protections of your particular State's Insurance Code or Statutes.`,
  },
];

const StateNotices = () => {
  return (
    <>
      <Helmet>
        <title>State Notices | MPB Health</title>
        <meta name="description" content="View state-specific notices for MPB Health medical cost sharing and health care sharing ministries. Important regulatory disclosures and availability by state of residence." />
      </Helmet>

      <LandingPage className="legal">
        <PageHero
          ariaLabel="State notices"
          align="center"
          title="State notices"
          lede="Important state-specific disclosures and notices."
        />

        <Sheet>
          <section className="lr-sec lr-sec--top" aria-label="State notices text">
            <div className="lr-inner">
              <div className="lr-prose">
                <h2>Disclaimer</h2>
                <p>
                  <strong>Notice:</strong> Medical cost sharing is neither insurance nor an insurance policy, nor is it offered by an insurance company. It is not a discount-healthcare program or a discount-health-card program. Participation in medical cost sharing is entirely voluntary—no organization or member is legally obligated or may be compelled to pay your medical bills.
                </p>

                <p>
                  Accordingly, medical cost sharing should never be viewed as insurance, and you remain personally responsible for all of your medical expenses, regardless of whether you receive any shared amounts or whether the program continues. Medical cost sharing is not governed by your state's insurance laws or consumer-protection statutes.
                </p>

                <p>
                  <em>***Please refer to this notice if your state is not listed among the notices below.***</em>
                </p>

                <h2>Notices by state</h2>
              </div>

              <ul className="lr-ledger lr-ledger--1 lr-notices">
                {NOTICES.map((n) => (
                  <li key={n.state}>
                    <h3>{n.state}</h3>
                    {n.washington ? (
                      <p>
                        Please see our full <Link to="/washington-statement">Washington statement here</Link>.
                      </p>
                    ) : (
                      <p>{n.text}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </Sheet>
      </LandingPage>
    </>
  );
};

export { StateNotices };
export default StateNotices;
