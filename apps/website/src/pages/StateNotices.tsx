import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const StateNotices = () => {
  return (
    <>
      <Helmet>
        <title>State Notices | MPB Health</title>
        <meta name="description" content="State-specific notices regarding medical cost sharing and health care sharing ministries." />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#e8f3fc] via-[#d4e7f7] to-[#c4ddf2] pt-8 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgMi4yMS0xLjc5IDQtNCA0cy00LTEuNzktNC00IDEuNzktNCA0LTQgNCAxLjc5IDQgNHptLTQgMjhjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00ek0xNiAzNmMtMi4yMSAwLTQgMS43OS00IDRzMS43OSA0IDQgNCA0LTEuNzkgNC00LTEuNzktNC00LTR6bTI4IDBjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00em0tMTItMTJjLTIuMjEgMC00IDEuNzktNCA0czEuNzkgNCA0IDQgNC0xLjc5IDQtNC0xLjc5LTQtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-[#0a4c8f]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-[#0a4c8f]/15 rounded-full blur-3xl"></div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0a4c8f]/10 backdrop-blur-sm rounded-2xl mb-6 border border-[#0a4c8f]/20">
                <svg className="w-10 h-10 text-[#0a4c8f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0a4c8f] mb-6 leading-tight">
                State Notices
              </h1>

              <p className="text-xl sm:text-2xl text-[#0a4c8f]/80 max-w-3xl mx-auto leading-relaxed">
                Important state-specific disclosures and notices
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-[#0a4c8f]/90">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0a4c8f]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">State Regulations</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0a4c8f]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Legal Compliance</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0a4c8f]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Consumer Protection</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 sm:py-16 pb-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <h3 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Disclaimer</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 italic text-slate-600 my-6">
                <p className="mb-4">
                  <strong>Notice:</strong> Medical cost sharing is neither insurance nor an insurance policy, nor is it offered by an insurance company. It is not a discount-healthcare program or a discount-health-card program. Participation in medical cost sharing is entirely voluntary—no organization or member is legally obligated or may be compelled to pay your medical bills.
                </p>
              </blockquote>

              <p className="text-slate-600 mb-6">
                Accordingly, medical cost sharing should never be viewed as insurance, and you remain personally responsible for all of your medical expenses, regardless of whether you receive any shared amounts or whether the program continues. Medical cost sharing is not governed by your state's insurance laws or consumer-protection statutes.
              </p>

              <p className="text-slate-600 italic mb-8">
                ***Please refer to this notice if your state is not listed among the notices below.***
              </p>

              <hr className="my-8 border-slate-300" />

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Alabama Code Title 22-6A-2</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Alaska Statute 21.03.021(k)</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The organization coordinating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. Participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive a payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Arizona Statute 20-122</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The organization facilitating the sharing of medical expenses is not an insurance company and the ministry's guidelines and plan of operation are not an insurance policy. Whether anyone chooses to assist you with your medical bills will be completely voluntary because participants are not compelled by law to contribute toward your medical bills. Therefore, participation in the ministry or a subscription to any of its documents should not be considered to be insurance. Regardless of whether you receive any payment for medical expenses or whether this ministry continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Arkansas Code 23-60-104.2</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The organization facilitating the sharing of medical expenses is not an insurance company and neither its guidelines nor plan of operation is an insurance policy. If anyone chooses to assist you with your medical bills, it will be totally voluntary because participants are not compelled by law to contribute toward your medical bills. Participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive payment for medical expenses or if this organization continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Florida Statute 624.1265</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor its plan of operation is an insurance policy. Membership is not offered through an insurance company, and the organization is not subject to the regulatory requirements or consumer protections of the Florida Insurance Code. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant is compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payments for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Georgia Statute 33-1-20</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Idaho Statute 41-121</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Illinois Statute 215-5/4-Class 1-b</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation constitute or create an insurance policy. Any assistance you receive with your medical bills will be totally voluntary. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Whether or not you receive any payments for medical expenses and whether or not this organization continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Indiana Code 27-1-2.1</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor its plan of operation is an insurance policy. Any assistance you receive with your medical bills will be totally voluntary. Neither the organization nor any other participant can be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Whether or not you receive any payments for medical expenses and whether or not this organization continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Kentucky Revised Statute 304.1-120 (7)</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: Under Kentucky law, the religious organization facilitating the sharing of medical expenses is not an insurance company, and its guidelines, plan of operation, or any other document of the religious organization do not constitute or create an insurance policy. Participation in the religious organization or a subscription to any of its documents shall not be considered insurance. Any assistance you receive with your medical bills will be totally voluntary. Neither the organization or any participant shall be compelled by law to contribute toward your medical bills. Whether or not you receive any payments for medical expenses, and whether or not this organization continues to operate, you shall be personally responsible for the payment of your medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Louisiana Revised Statute Title 22-318,319</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The ministry facilitating the sharing of medical expenses is not an insurance company. Neither the guidelines nor the plan of operation of the ministry constitutes an insurance policy. Financial assistance for the payment of medical expenses is strictly voluntary. Participation in the ministry or a subscription to any publication issued by the ministry shall not be considered as enrollment in any health insurance plan or as a waiver of your responsibility to pay your medical expenses.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Maine Revised Statute Title 24-A, §704, sub-§3</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The organization facilitating the sharing of medical expenses is not an insurance company and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. Participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Maryland Article 48, Section 1-202(4)</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: This publication is not issued by an insurance company nor is it offered through an insurance company. It does not guarantee or promise that your medical bills will be published or assigned to others for payment. No other subscriber will be compelled to contribute toward the cost of your medical bills. Therefore, this publication should never be considered a substitute for an insurance policy. This activity is not regulated by the State Insurance Administration, and your liabilities are not covered by the Life and Health Guaranty Fund. Whether or not you receive any payments for medical expenses and whether or not this entity continues to operate, you are always liable for any unpaid bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Michigan Section 550.1867</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: Zion HealthShare is not an insurance company and the financial assistance provided through the ministry is not insurance and is not provided through an insurance company. Whether any participant in the ministry chooses to assist another participant who has financial or medical needs is totally voluntary. A participant will not be compelled by law to contribute toward the financial or medical needs of another participant. This document is not a contract of insurance or a promise to pay for the financial or medical needs of a participant by the ministry. A participant who receives assistance from the ministry for his or her financial or medical needs remains personally responsible for the payment of all of his or her medical bills and other obligations incurred in meeting his or her financial or medical needs.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Mississippi Title 83-77-1</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payment of medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Missouri Section 376.1750</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: This publication is not an insurance company nor is it offered through an insurance company. Whether anyone chooses to assist you with your medical bills will be totally voluntary, as no other subscriber or member will be compelled to contribute toward your medical bills. As such, this publication should never be considered to be insurance. Whether you receive any payments for medical expenses and whether or not this publication continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Montana Code Annotated 50-4-111</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The health care sharing ministry facilitating the sharing of medical expenses is not an insurance company and does not use insurance agents or pay commissions to insurance agents. The health care sharing ministry's guidelines and plan of operation are not an insurance policy. Without health care insurance, there is no guarantee that you, a fellow member, or any other person who is a party to the health care sharing ministry agreement will be protected in the event of illness or emergency. Regardless of whether you receive any payment for medical expenses or whether the health care sharing ministry terminates, withdraws from the faith-based agreement, or continues to operate, you are always personally responsible for the payment of your own medical bills. If your participation in the health care sharing ministry ends, state law may subject you to a waiting period before you are able to apply for health insurance coverage.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Nebraska Revised Statute Chapter 44-311</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>IMPORTANT NOTICE. This organization is not an insurance company, and its product should never be considered insurance. If you join this organization instead of purchasing health insurance, you will be considered uninsured. By the terms of this agreement, whether anyone chooses to assist you with your medical bills as a participant of this organization will be totally voluntary, and neither the organization nor any participant can be compelled by law to contribute toward your medical bills. Regardless of whether you receive payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills. This organization is not regulated by the Nebraska Department of Insurance. You should review this organization's guidelines carefully to be sure you understand any limitations that may affect your personal medical and financial needs.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">New Hampshire Section 126-V:1</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>IMPORTANT NOTICE: This organization is not an insurance company, and its product should never be considered insurance. If you join this organization instead of purchasing health insurance, you will be considered uninsured. By the terms of this agreement, whether anyone chooses to assist you with your medical bills as a participant of this organization will be totally voluntary, and neither the organization nor any participant can be compelled by law to contribute toward your medical bills. Regardless of whether you receive payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills. This organization is not regulated by the New Hampshire Insurance Department. You should review this organization's guidelines carefully to be sure you understand any limitations that may affect your personal medical and financial needs.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">North Carolina Statute 58-49-12</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The organization facilitating the sharing of medical expenses is not an insurance company and neither its guidelines nor its plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be voluntary. No other participant will be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payment for medical expenses or whether this organization continues to operate, you are always personally liable for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Pennsylvania 40 Penn. Statute Section 23(b)</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: This publication is not an insurance company nor is it offered through an insurance company. This publication does not guarantee or promise that your medical bills will be published or assigned to others for payment. Whether anyone chooses to pay your medical bills will be totally voluntary. As such, this publication should never be considered a substitute for insurance. Whether you receive any payments for medical expenses and whether or not this publication continues to operate, you are always liable for any unpaid bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">South Dakota Statute Title 58-1-3.3</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payments for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Texas Code Title 8, K, 1681.001</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: This health care sharing ministry facilitates the sharing of medical expenses and is not an insurance company, and neither its guidelines nor its plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. As such, participation in the ministry or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payment for medical expenses or whether this ministry continues to operate, you are always personally responsible for the payment of your own medical bills. Complaints concerning this health care sharing ministry may be reported to the office of the Texas attorney general.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Utah Code 07.31.2024</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Whether anyone chooses to assist you with your medical bills will be totally voluntary because no other participant will be compelled by law to contribute toward your medical bills. As such, participation in the organization or a subscription to any of its documents should never be considered to be insurance. Regardless of whether you receive any payment for medical expenses or whether this organization continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Virginia Code 38.2-6300-6301</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: This publication is not insurance, and is not offered through an insurance company. Whether anyone chooses to assist you with your medical bills will be totally voluntary, as no other member will be compelled by law to contribute toward your medical bills. As such, this publication should never be considered to be insurance. Whether you receive any payments for medical expenses and whether or not this publication continues to operate, you are always personally responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Washington</h3>
              <p className="text-slate-600 mb-6">
                Please see our full <Link to="/washington-statement" className="text-[#0a4c8f] hover:underline">Washington statement here</Link>.
              </p>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Wisconsin Statute 600.01 (1) (b) (9)</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>ATTENTION: This publication is not issued by an insurance company, nor is it offered through an insurance company. This publication does not guarantee or promise that your medical bills will be published or assigned to others for payment. Whether anyone chooses to pay your medical bills is entirely voluntary. This publication should never be considered a substitute for an insurance policy. Whether or not you receive any payments for medical expenses, and whether or not this publication continues to operate, you are responsible for the payment of your own medical bills.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Wyoming 26.1.104 (a)(v)(C)</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>Notice: The organization facilitating the sharing of medical expenses is not an insurance company, and neither its guidelines nor plan of operation is an insurance policy. Any assistance with your medical bills is completely voluntary. No other participant is compelled by law or otherwise to contribute toward your medical bills. Participation in the organization or a subscription to any of its documents shall not be considered to be health insurance and is not subject to the regulatory requirements or consumer protections of the Wyoming insurance code. You are personally responsible for payment of your medical bills regardless of any financial sharing you may receive from the organization for medical expenses. You are also responsible for payment of your medical bills if the organization ceases to exist or ceases to facilitate the sharing of medical expenses.</p>
              </blockquote>

              <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">All States Not Listed Above:</h3>
              <blockquote className="border-l-4 border-[#0a4c8f] pl-4 text-slate-600 my-6">
                <p>NOTICE: Medical Cost Sharing is not insurance or an insurance policy nor is it offered through an insurance company. Medical Cost Sharing is not a discount healthcare program nor a discount health card program. Whether anyone chooses to assist you with your medical bills will be totally voluntary, as neither the Medical Cost Sharing Community nor any other member is liable for or may be compelled to make the payment of your medical bill. As such, Medical Cost Sharing should never be considered to be insurance. Whether you receive any amounts for medical expenses and whether or not a Medical Cost Sharing Organization continues to operate, you are always personally responsible for the payment of your own medical bills. Medical Cost Sharing is not subject to the regulatory requirements or consumer protections of your particular State's Insurance Code or Statutes.</p>
              </blockquote>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export { StateNotices };
export default StateNotices;
