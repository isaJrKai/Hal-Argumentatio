import React, { useState } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Database, 
  DollarSign, 
  Percent, 
  Clock, 
  Briefcase, 
  ArrowRight, 
  CheckCircle,
  HelpCircle,
  Zap,
  Users
} from 'lucide-react';

export default function CalculatorsSection() {
  const [activeCalc, setActiveCalc] = useState<'margin' | 'ads' | 'list'>('margin');

  // Calculator 1: Pricing / Margin
  const [modelType, setModelType] = useState<'arbitrage' | 'ops'>('arbitrage');
  const [workerPay, setWorkerPay] = useState<number>(8); // $8/hr
  const [weeklyHours, setWeeklyHours] = useState<number>(30); // 30 hrs/week
  const [markupPercent, setMarkupPercent] = useState<number>(50); // 50% markup
  const [contractorsCount, setContractorsCount] = useState<number>(3); // 3 contractors
  
  // Automation-ops parameters
  const [softwareCost, setSoftwareCost] = useState<number>(4); // $4/mo/client
  const [adminHours, setAdminHours] = useState<number>(2); // 2 hours/month
  const [adminRate, setAdminRate] = useState<number>(15); // $15/hr
  const [monthlyRetainer, setMonthlyRetainer] = useState<number>(199); // $199/mo
  const [clientsCount, setClientsCount] = useState<number>(5); // 5 clients

  // Calculator 2: Ad Spend Break-Even
  const [adSpend, setAdSpend] = useState<number>(1000); // $1000/mo
  const [cpl, setCpl] = useState<number>(50); // $50/lead
  const [meetingRate, setMeetingRate] = useState<number>(20); // 20% close to meeting
  const [dealRate, setDealRate] = useState<number>(25); // 25% meeting to deal
  const [dealValue, setDealValue] = useState<number>(2500); // $2500 deal value
  const [serviceMargin, setServiceMargin] = useState<number>(60); // 60% fulfillment margin

  // Calculator 3: List / Subscription Pricing
  const [listTime, setListTime] = useState<number>(6); // 6 hours
  const [hourlyRate, setHourlyRate] = useState<number>(50); // $50/hr
  const [toolCosts, setToolCosts] = useState<number>(20); // $20 tools
  const [packageModel, setPackageModel] = useState<'one-time' | 'subscription'>('subscription');
  
  // List parameters
  const [licensesCount, setLicensesCount] = useState<number>(5); // 5 licenses
  const [licensePrice, setLicensePrice] = useState<number>(149); // $149/license
  const [subscribersCount, setSubscribersCount] = useState<number>(12); // 12 active subscribers
  const [subPrice, setSubPrice] = useState<number>(99); // $99/mo
  const [churnRate, setChurnRate] = useState<number>(10); // 10% monthly churn

  // Calculations for Margin Calculator
  const calcMargin = () => {
    if (modelType === 'arbitrage') {
      const hourlyClientRate = workerPay * (1 + markupPercent / 100);
      const weeklyCostPerContractor = workerPay * weeklyHours;
      const weeklyRevenuePerContractor = hourlyClientRate * weeklyHours;
      const weeklyProfitPerContractor = weeklyRevenuePerContractor - weeklyCostPerContractor;
      
      const totalWeeklyRevenue = weeklyRevenuePerContractor * contractorsCount;
      const totalWeeklyCost = weeklyCostPerContractor * contractorsCount;
      const totalWeeklyProfit = weeklyProfitPerContractor * contractorsCount;

      const monthlyRevenue = totalWeeklyRevenue * 4.33;
      const monthlyCost = totalWeeklyCost * 4.33;
      const monthlyProfit = totalWeeklyProfit * 4.33;
      const annualProfit = monthlyProfit * 12;
      const grossMarginPercent = ((hourlyClientRate - workerPay) / hourlyClientRate) * 100;

      return {
        hourlyClientRate,
        totalWeeklyRevenue,
        totalWeeklyCost,
        totalWeeklyProfit,
        monthlyRevenue,
        monthlyCost,
        monthlyProfit,
        annualProfit,
        grossMarginPercent,
        label1: 'Hourly Pay Rate',
        value1: `$${workerPay.toFixed(2)}/hr`,
        label2: 'Client Billable Rate',
        value2: `$${hourlyClientRate.toFixed(2)}/hr`,
        label3: 'Profit spread/hr',
        value3: `$${(hourlyClientRate - workerPay).toFixed(2)}/hr`
      };
    } else {
      // Automation Ops Model
      const monthlyCostPerClient = softwareCost + (adminHours * adminRate);
      const monthlyProfitPerClient = monthlyRetainer - monthlyCostPerClient;

      const totalMonthlyRevenue = monthlyRetainer * clientsCount;
      const totalMonthlyCost = monthlyCostPerClient * clientsCount;
      const totalMonthlyProfit = monthlyProfitPerClient * clientsCount;
      const annualProfit = totalMonthlyProfit * 12;
      const grossMarginPercent = (monthlyProfitPerClient / monthlyRetainer) * 100;

      return {
        hourlyClientRate: monthlyRetainer,
        totalWeeklyRevenue: totalMonthlyRevenue / 4.33,
        totalWeeklyCost: totalMonthlyCost / 4.33,
        totalWeeklyProfit: totalMonthlyProfit / 4.33,
        monthlyRevenue: totalMonthlyRevenue,
        monthlyCost: totalMonthlyCost,
        monthlyProfit: totalMonthlyProfit,
        annualProfit,
        grossMarginPercent,
        label1: 'Internal Ops Cost',
        value1: `$${monthlyCostPerClient.toFixed(2)}/mo`,
        label2: 'Retainer Price',
        value2: `$${monthlyRetainer.toFixed(2)}/mo`,
        label3: 'Net Profit/Client',
        value3: `$${monthlyProfitPerClient.toFixed(2)}/mo`
      };
    }
  };

  // Calculations for Ad Spend Break-Even
  const calcAds = () => {
    const leadsCount = adSpend / cpl;
    const meetingsCount = leadsCount * (meetingRate / 100);
    const dealsCount = meetingsCount * (dealRate / 100);
    const grossRevenue = dealsCount * dealValue;
    const fulfillmentCost = grossRevenue * (1 - serviceMargin / 100);
    const netCampaignProfit = (grossRevenue * (serviceMargin / 100)) - adSpend;
    const roas = adSpend > 0 ? grossRevenue / adSpend : 0;

    // Break-even math
    // Break-even revenue needed = AdSpend / FulfillmentMarginPercent
    const breakEvenRevenueNeeded = adSpend / (serviceMargin / 100);
    const breakEvenDealsNeeded = dealValue > 0 ? breakEvenRevenueNeeded / dealValue : 0;
    const breakEvenLealsNeeded = leadsCount > 0 && dealsCount > 0 ? (breakEvenDealsNeeded / dealsCount) * leadsCount : 0;

    return {
      leadsCount,
      meetingsCount,
      dealsCount,
      grossRevenue,
      fulfillmentCost,
      netCampaignProfit,
      roas,
      breakEvenDealsNeeded,
      breakEvenLealsNeeded,
      breakEvenRevenueNeeded
    };
  };

  // Calculations for List Subscription Pricing
  const calcList = () => {
    const timeCost = listTime * hourlyRate;
    const totalInternalBuildCost = timeCost + toolCosts;

    if (packageModel === 'one-time') {
      const grossRevenue = licensePrice * licensesCount;
      const netProfit = grossRevenue - totalInternalBuildCost;
      const breakEvenLicenses = licensePrice > 0 ? Math.ceil(totalInternalBuildCost / licensePrice) : 0;
      const roti = totalInternalBuildCost > 0 ? (netProfit / totalInternalBuildCost) * 100 : 0;

      return {
        totalInternalBuildCost,
        grossRevenue,
        netProfit,
        breakEvenSales: breakEvenLicenses,
        roti,
        modelLabel: 'License Sales target',
        modelCount: `${licensesCount} Licenses`,
        subBreak: `${breakEvenLicenses} Sales`
      };
    } else {
      // Subscription model
      const grossRevenueMonthly = subPrice * subscribersCount;
      const churnCount = subscribersCount * (churnRate / 100);
      const grossRevenueAnnual = grossRevenueMonthly * 12;
      const netProfitAnnual = grossRevenueAnnual - totalInternalBuildCost;
      const breakEvenSubscribers = subPrice > 0 ? Math.ceil(totalInternalBuildCost / subPrice) : 0;
      const roti = totalInternalBuildCost > 0 ? (netProfitAnnual / totalInternalBuildCost) * 100 : 0;

      return {
        totalInternalBuildCost,
        grossRevenue: grossRevenueMonthly, // monthly for list box
        netProfit: netProfitAnnual, // annual projection
        breakEvenSales: breakEvenSubscribers,
        roti,
        modelLabel: 'Active Subscribers',
        modelCount: `${subscribersCount} Accounts`,
        subBreak: `${breakEvenSubscribers} Active Subs`
      };
    }
  };

  const marginResults = calcMargin();
  const adsResults = calcAds();
  const listResults = calcList();

  return (
    <div className="space-y-6">
      {/* CALCULATOR SWITCHER TABS */}
      <div className="flex flex-col sm:flex-row gap-2 border-b border-border-dim pb-2 text-xs">
        <button
          onClick={() => setActiveCalc('margin')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-mono uppercase tracking-wider transition-all ${
            activeCalc === 'margin'
              ? 'border-accent text-accent font-bold bg-accent/5'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Markup & Margin
        </button>

        <button
          onClick={() => setActiveCalc('ads')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-mono uppercase tracking-wider transition-all ${
            activeCalc === 'ads'
              ? 'border-accent text-accent font-bold bg-accent/5'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Ad Spend Break-Even
        </button>

        <button
          onClick={() => setActiveCalc('list')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 font-mono uppercase tracking-wider transition-all ${
            activeCalc === 'list'
              ? 'border-accent text-accent font-bold bg-accent/5'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Lead List Pricing
        </button>
      </div>

      {/* CALCULATOR PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-5 bg-bg-raised border border-border-dim p-5 rounded-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-border-dim pb-2.5">
            <Calculator className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
              {activeCalc === 'margin' && 'Margin Parameters'}
              {activeCalc === 'ads' && 'Ad Spend Scenarios'}
              {activeCalc === 'list' && 'List Unit Economics'}
            </h3>
          </div>

          {/* CALCULATOR 1: MARGIN AND MARKUP */}
          {activeCalc === 'margin' && (
            <div className="space-y-4 font-sans text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-text-secondary uppercase tracking-wider block">Operational Model Type</label>
                <div className="grid grid-cols-2 gap-2 bg-bg-base p-1 border border-border-dim rounded-sm">
                  <button
                    type="button"
                    onClick={() => setModelType('arbitrage')}
                    className={`py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
                      modelType === 'arbitrage' ? 'bg-accent text-black' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Talent Arbitrage
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelType('ops')}
                    className={`py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
                      modelType === 'ops' ? 'bg-accent text-black' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Automation Ops
                  </button>
                </div>
              </div>

              {modelType === 'arbitrage' ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-text-secondary uppercase">Worker Hourly Pay Rate (USD)</span>
                      <span className="text-text-primary font-bold">${workerPay}/hr</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="40"
                      step="0.5"
                      value={workerPay}
                      onChange={(e) => setWorkerPay(parseFloat(e.target.value))}
                      className="w-full accent-accent bg-bg-subtle"
                    />
                    <span className="text-[9px] text-text-tertiary">Amount paid directly to the remote developer, VA, or bookkeeper.</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-text-secondary uppercase">Weekly Contractor Hours</span>
                      <span className="text-text-primary font-bold">{weeklyHours} Hrs</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="1"
                      value={weeklyHours}
                      onChange={(e) => setWeeklyHours(parseInt(e.target.value))}
                      className="w-full accent-accent bg-bg-subtle"
                    />
                    <span className="text-[9px] text-text-tertiary">Standard client commitment hours per contractor.</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-text-secondary uppercase">Target Markup Percentage</span>
                      <span className="text-text-primary font-bold">{markupPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      step="5"
                      value={markupPercent}
                      onChange={(e) => setMarkupPercent(parseInt(e.target.value))}
                      className="w-full accent-accent bg-bg-subtle"
                    />
                    <span className="text-[9px] text-text-tertiary">Your agency fee markup. 50% means you sell at 1.5x of pay.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-text-secondary uppercase tracking-wider block">Contractor Count (Scaling)</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={contractorsCount}
                      onChange={(e) => setContractorsCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-bg-base border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors font-mono"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-text-secondary uppercase">Software/API Cost per Client</span>
                      <span className="text-text-primary font-bold">${softwareCost}/mo</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="1"
                      value={softwareCost}
                      onChange={(e) => setSoftwareCost(parseInt(e.target.value))}
                      className="w-full accent-accent bg-bg-subtle"
                    />
                    <span className="text-[9px] text-text-tertiary">Average monthly SaaS overhead (Twilio phone number, Zapier usage).</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-text-secondary uppercase">Admin Maintenance Hours/mo</span>
                      <span className="text-text-primary font-bold">{adminHours} Hrs</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={adminHours}
                      onChange={(e) => setAdminHours(parseFloat(e.target.value))}
                      className="w-full accent-accent bg-bg-subtle"
                    />
                    <span className="text-[9px] text-text-tertiary">Time required to monitor or fix tasks per client each month.</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-text-secondary uppercase">Admin Internal Rate</span>
                      <span className="text-text-primary font-bold">${adminRate}/hr</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="1"
                      value={adminRate}
                      onChange={(e) => setAdminRate(parseInt(e.target.value))}
                      className="w-full accent-accent bg-bg-subtle"
                    />
                    <span className="text-[9px] text-text-tertiary">Hourly valuation of the technician maintaining the client workflows.</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-text-secondary uppercase">Monthly Retainer Price</span>
                      <span className="text-text-primary font-bold">${monthlyRetainer}/mo</span>
                    </div>
                    <input
                      type="range"
                      min="49"
                      max="499"
                      step="10"
                      value={monthlyRetainer}
                      onChange={(e) => setMonthlyRetainer(parseInt(e.target.value))}
                      className="w-full accent-accent bg-bg-subtle"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-text-secondary uppercase tracking-wider block">Active Client Count</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={clientsCount}
                      onChange={(e) => setClientsCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-bg-base border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors font-mono"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* CALCULATOR 2: AD SPEND BREAK-EVEN */}
          {activeCalc === 'ads' && (
            <div className="space-y-4 font-sans text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-text-secondary uppercase">Monthly Ad Spend Budget</span>
                  <span className="text-text-primary font-bold">${adSpend}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="10000"
                  step="100"
                  value={adSpend}
                  onChange={(e) => setAdSpend(parseInt(e.target.value))}
                  className="w-full accent-accent bg-bg-subtle"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-text-secondary uppercase">Cost Per Lead (CPL)</span>
                  <span className="text-text-primary font-bold">${cpl}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={cpl}
                  onChange={(e) => setCpl(parseInt(e.target.value))}
                  className="w-full accent-accent bg-bg-subtle"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-text-secondary uppercase">Lead → Meeting Rate</span>
                  <span className="text-text-primary font-bold">{meetingRate}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={meetingRate}
                  onChange={(e) => setMeetingRate(parseInt(e.target.value))}
                  className="w-full accent-accent bg-bg-subtle"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-text-secondary uppercase">Meeting → Deal Close Rate</span>
                  <span className="text-text-primary font-bold">{dealRate}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={dealRate}
                  onChange={(e) => setDealRate(parseInt(e.target.value))}
                  className="w-full accent-accent bg-bg-subtle"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-text-secondary uppercase">Average Deal Value / LTV</span>
                  <span className="text-text-primary font-bold">${dealValue}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="15000"
                  step="250"
                  value={dealValue}
                  onChange={(e) => setDealValue(parseInt(e.target.value))}
                  className="w-full accent-accent bg-bg-subtle"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-text-secondary uppercase">Gross Profit Margin on Service</span>
                  <span className="text-text-primary font-bold">{serviceMargin}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="95"
                  step="5"
                  value={serviceMargin}
                  onChange={(e) => setServiceMargin(parseInt(e.target.value))}
                  className="w-full accent-accent bg-bg-subtle"
                />
              </div>
            </div>
          )}

          {/* CALCULATOR 3: LIST / SUBSCRIPTION PRICING */}
          {activeCalc === 'list' && (
            <div className="space-y-4 font-sans text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-text-secondary uppercase tracking-wider block">Packaging Distribution Model</label>
                <div className="grid grid-cols-2 gap-2 bg-bg-base p-1 border border-border-dim rounded-sm">
                  <button
                    type="button"
                    onClick={() => setPackageModel('one-time')}
                    className={`py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
                      packageModel === 'one-time' ? 'bg-accent text-black' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    One-time List Sale
                  </button>
                  <button
                    type="button"
                    onClick={() => setPackageModel('subscription')}
                    className={`py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider font-bold transition-all ${
                      packageModel === 'subscription' ? 'bg-accent text-black' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Recurring Sub
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-text-secondary uppercase">Your Compilation Time</span>
                  <span className="text-text-primary font-bold">{listTime} Hours</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  step="1"
                  value={listTime}
                  onChange={(e) => setListTime(parseInt(e.target.value))}
                  className="w-full accent-accent bg-bg-subtle"
                />
                <span className="text-[9px] text-text-tertiary">Time spent scraping, cleaning, enrichment-tagging, and manual verification.</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-text-secondary uppercase">Your Hourly Valuation Rate</span>
                  <span className="text-text-primary font-bold">${hourlyRate}/hr</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="150"
                  step="5"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(parseInt(e.target.value))}
                  className="w-full accent-accent bg-bg-subtle"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-text-secondary uppercase">External Tool Costs (Proxies, Scrapers)</span>
                  <span className="text-text-primary font-bold">${toolCosts}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="5"
                  value={toolCosts}
                  onChange={(e) => setToolCosts(parseInt(e.target.value))}
                  className="w-full accent-accent bg-bg-subtle"
                />
              </div>

              {packageModel === 'one-time' ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-text-secondary uppercase">One-time List Sale Price</span>
                      <span className="text-text-primary font-bold">${licensePrice}</span>
                    </div>
                    <input
                      type="range"
                      min="49"
                      max="499"
                      step="10"
                      value={licensePrice}
                      onChange={(e) => setLicensePrice(parseInt(e.target.value))}
                      className="w-full accent-accent bg-bg-subtle"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-text-secondary uppercase tracking-wider block">Target Sales Count</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={licensesCount}
                      onChange={(e) => setLicensesCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-bg-base border border-border-dim rounded-sm px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors font-mono"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-text-secondary uppercase">Monthly Subscription Price</span>
                      <span className="text-text-primary font-bold">${subPrice}/mo</span>
                    </div>
                    <input
                      type="range"
                      min="29"
                      max="299"
                      step="5"
                      value={subPrice}
                      onChange={(e) => setSubPrice(parseInt(e.target.value))}
                      className="w-full accent-accent bg-bg-subtle"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-text-secondary uppercase">Target Active Subscriptions</span>
                      <span className="text-text-primary font-bold">{subscribersCount} Subs</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={subscribersCount}
                      onChange={(e) => setSubscribersCount(parseInt(e.target.value))}
                      className="w-full accent-accent bg-bg-subtle"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-text-secondary uppercase">Expected Monthly Churn Rate</span>
                      <span className="text-text-primary font-bold">{churnRate}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="1"
                      value={churnRate}
                      onChange={(e) => setChurnRate(parseInt(e.target.value))}
                      className="w-full accent-accent bg-bg-subtle"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* OUTPUTS / VISUALIZATION COLUMN */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* CALCULATOR 1 OUTPUT */}
          {activeCalc === 'margin' && (
            <div className="space-y-6">
              {/* PRIMARY STATS BAR */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-bg-raised border border-border-dim p-4 rounded-sm">
                  <span className="text-[9px] font-mono text-text-tertiary uppercase block">Monthly Revenue</span>
                  <span className="text-lg font-bold font-mono text-text-primary mt-1 block">
                    ${marginResults.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="bg-bg-raised border border-border-dim p-4 rounded-sm">
                  <span className="text-[9px] font-mono text-text-tertiary uppercase block">Monthly Net Profit</span>
                  <span className="text-lg font-bold font-mono text-accent mt-1 block">
                    ${marginResults.monthlyProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="bg-bg-raised border border-border-dim p-4 rounded-sm">
                  <span className="text-[9px] font-mono text-text-tertiary uppercase block">Gross Margin %</span>
                  <span className="text-lg font-bold font-mono text-text-primary mt-1 block">
                    {marginResults.grossMarginPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* DETAILS AND CHART VISUAL */}
              <div className="bg-bg-raised border border-border-dim p-5 rounded-sm space-y-5">
                <h4 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider border-b border-border-dim pb-2.5">
                  Unit Breakdown Analysis
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Progress splits */}
                  <div className="space-y-4 font-mono text-[11px]">
                    <div className="flex justify-between border-b border-border-dim pb-1.5">
                      <span className="text-text-secondary uppercase">{marginResults.label1}:</span>
                      <span className="text-text-primary font-bold">{marginResults.value1}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-dim pb-1.5">
                      <span className="text-text-secondary uppercase">{marginResults.label2}:</span>
                      <span className="text-text-primary font-bold">{marginResults.value2}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-dim pb-1.5 text-accent">
                      <span className="uppercase font-bold">{marginResults.label3}:</span>
                      <span className="font-bold">{marginResults.value3}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-dim pb-1.5">
                      <span className="text-text-secondary uppercase">Annualized Net Profit Projection:</span>
                      <span className="text-emerald-400 font-bold">${marginResults.annualProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  {/* Visual Progress Spread */}
                  <div className="bg-bg-base border border-border-dim p-4 rounded-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-text-tertiary uppercase font-bold tracking-wider block mb-2.5">Profit Spread Distribution</span>
                      <div className="w-full h-5 bg-red-950/40 border border-red-900/30 rounded-sm overflow-hidden flex">
                        <div 
                          className="h-full bg-red-700/80" 
                          style={{ width: `${100 - marginResults.grossMarginPercent}%` }}
                          title="Fulfillment Cost Share"
                        />
                        <div 
                          className="h-full bg-accent" 
                          style={{ width: `${marginResults.grossMarginPercent}%` }}
                          title="Net Profit Share"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 text-[9px] font-mono mt-4 pt-4 border-t border-border-dim/40">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-700 rounded-xs" /> Fulfillment Costs ({ (100 - marginResults.grossMarginPercent).toFixed(1) }%)</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-accent rounded-xs" /> Net Spread Margin ({ marginResults.grossMarginPercent.toFixed(1) }%)</span>
                    </div>
                  </div>
                </div>

                {/* Swiss-style explanatory commentary */}
                <div className="bg-bg-base border border-border-dim p-4 rounded-sm font-sans text-xs text-text-secondary leading-relaxed space-y-2">
                  <div className="flex items-center gap-1.5 text-text-primary font-mono text-[10px] font-bold uppercase">
                    <CheckCircle className="w-3.5 h-3.5 text-accent" />
                    <span>HAL Operational Evaluation</span>
                  </div>
                  {modelType === 'arbitrage' ? (
                    <p>
                      At a **${workerPay}/hr** pay rate with a **{markupPercent}% markup**, your pricing of **${marginResults.hourlyClientRate.toFixed(2)}/hr** remains highly competitive in North American or Western markets while offering life-changing, secure income to remote professionals. Scale this to **{contractorsCount}** active placements to generate an annualized net profit run-rate of **${marginResults.annualProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD**.
                    </p>
                  ) : (
                    <p>
                      With **{clientsCount}** active local clients on your **${monthlyRetainer}/mo** automation suite, you achieve an incredible **{marginResults.grossMarginPercent.toFixed(1)}% gross profit margin**. Software cost and maintenance admin time only total **{marginResults.value1}** monthly, making this a highly scalable, friction-free agency recurring product.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CALCULATOR 2 OUTPUT */}
          {activeCalc === 'ads' && (
            <div className="space-y-6">
              {/* PRIMARY STATS BAR */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-bg-raised border border-border-dim p-4 rounded-sm">
                  <span className="text-[9px] font-mono text-text-tertiary uppercase block">Generated Revenue</span>
                  <span className="text-lg font-bold font-mono text-text-primary mt-1 block">
                    ${adsResults.grossRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="bg-bg-raised border border-border-dim p-4 rounded-sm">
                  <span className="text-[9px] font-mono text-text-tertiary uppercase block">Net Ad Profit</span>
                  <span className={`text-lg font-bold font-mono mt-1 block ${adsResults.netCampaignProfit >= 0 ? 'text-accent' : 'text-negative'}`}>
                    ${adsResults.netCampaignProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="bg-bg-raised border border-border-dim p-4 rounded-sm">
                  <span className="text-[9px] font-mono text-text-tertiary uppercase block">Return on Ad Spend (ROAS)</span>
                  <span className="text-lg font-bold font-mono text-text-primary mt-1 block">
                    {adsResults.roas.toFixed(2)}x
                  </span>
                </div>
              </div>

              {/* DETAILS AND CHART VISUAL */}
              <div className="bg-bg-raised border border-border-dim p-5 rounded-sm space-y-5">
                <h4 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider border-b border-border-dim pb-2.5">
                  Pipeline Funnel & Break-Even Evaluation
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Funnel Splits */}
                  <div className="space-y-3.5 font-mono text-[11px]">
                    <div className="flex justify-between border-b border-border-dim pb-1.5">
                      <span className="text-text-secondary uppercase">Estimated Leads:</span>
                      <span className="text-text-primary font-bold">{adsResults.leadsCount.toFixed(1)} leads</span>
                    </div>
                    <div className="flex justify-between border-b border-border-dim pb-1.5">
                      <span className="text-text-secondary uppercase">Opportunities/Meetings:</span>
                      <span className="text-text-primary font-bold">{adsResults.meetingsCount.toFixed(1)} meetings</span>
                    </div>
                    <div className="flex justify-between border-b border-border-dim pb-1.5">
                      <span className="text-text-secondary uppercase">Closed Deals:</span>
                      <span className="text-text-primary font-bold">{adsResults.dealsCount.toFixed(2)} deals</span>
                    </div>
                    <div className="flex justify-between border-b border-border-dim pb-1.5 text-accent font-bold">
                      <span className="uppercase">Break-Even Deals Needed:</span>
                      <span>{adsResults.breakEvenDealsNeeded.toFixed(2)} deals</span>
                    </div>
                    <div className="flex justify-between border-b border-border-dim pb-1.5">
                      <span className="text-text-secondary uppercase">Break-Even Leads Needed:</span>
                      <span className="text-text-primary font-bold">{adsResults.breakEvenLealsNeeded.toFixed(1)} leads</span>
                    </div>
                  </div>

                  {/* Funnel Visual representation */}
                  <div className="bg-bg-base border border-border-dim p-4 rounded-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-text-tertiary uppercase font-bold tracking-wider block mb-3">Campaign Funnel Visual</span>
                      <div className="space-y-2">
                        <div className="w-full bg-bg-subtle border border-border-dim h-4 rounded-sm relative overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-indigo-600/50 w-full flex items-center px-2 text-[8px] font-mono font-bold text-text-primary">Leads Generated (100%)</div>
                        </div>
                        <div className="w-full bg-bg-subtle border border-border-dim h-4 rounded-sm relative overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-blue-500/50 flex items-center px-2 text-[8px] font-mono font-bold text-text-primary" style={{ width: `${meetingRate}%` }}>Meetings Scheduled ({meetingRate}%)</div>
                        </div>
                        <div className="w-full bg-bg-subtle border border-border-dim h-4 rounded-sm relative overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-accent/60 flex items-center px-2 text-[8px] font-mono font-bold text-black" style={{ width: `${meetingRate * (dealRate / 100)}%` }}>Deals Closed ({ (meetingRate * (dealRate / 100)).toFixed(1) }%)</div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-text-tertiary mt-2 block leading-normal pt-2 border-t border-border-dim/40">
                      Overall conversion efficiency: **{ (meetingRate * (dealRate / 100)).toFixed(1) }%** from Lead to Closed Deal.
                    </span>
                  </div>
                </div>

                {/* Ad Spend narrative evaluation */}
                <div className="bg-bg-base border border-border-dim p-4 rounded-sm font-sans text-xs text-text-secondary leading-relaxed space-y-2">
                  <div className="flex items-center gap-1.5 text-text-primary font-mono text-[10px] font-bold uppercase">
                    <CheckCircle className="w-3.5 h-3.5 text-accent" />
                    <span>Client Break-Even Projection Pitch</span>
                  </div>
                  <p>
                    Use these exact calculations to pitch prospective clients with confidence: 
                    *"With a modest budget of **${adSpend}**, assuming a reasonable lead cost of **${cpl}**, we generate **{adsResults.leadsCount.toFixed(0)} leads**. Even if we only convert **{ (meetingRate * (dealRate / 100)).toFixed(1) }%** of those into customers, we close **{adsResults.dealsCount.toFixed(1)} deals** totaling **${adsResults.grossRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}** in gross revenue. At a **{serviceMargin}% margin**, your break-even point is merely **{adsResults.breakEvenDealsNeeded.toFixed(1)} deals** (or **{adsResults.breakEvenLealsNeeded.toFixed(0)} leads**). Everything else is pure profit."*
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CALCULATOR 3 OUTPUT */}
          {activeCalc === 'list' && (
            <div className="space-y-6">
              {/* PRIMARY STATS BAR */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-bg-raised border border-border-dim p-4 rounded-sm">
                  <span className="text-[9px] font-mono text-text-tertiary uppercase block">Compilation Build Cost</span>
                  <span className="text-lg font-bold font-mono text-text-primary mt-1 block">
                    ${listResults.totalInternalBuildCost.toFixed(2)}
                  </span>
                </div>
                <div className="bg-bg-raised border border-border-dim p-4 rounded-sm">
                  <span className="text-[9px] font-mono text-text-tertiary uppercase block">
                    {packageModel === 'one-time' ? 'Projected Gross Revenue' : 'Monthly Recurring revenue'}
                  </span>
                  <span className="text-lg font-bold font-mono text-text-primary mt-1 block">
                    ${listResults.grossRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="bg-bg-raised border border-border-dim p-4 rounded-sm">
                  <span className="text-[9px] font-mono text-text-tertiary uppercase block">
                    {packageModel === 'one-time' ? 'Return on Time (ROTI)' : 'Annualized Profit Run-rate'}
                  </span>
                  <span className="text-lg font-bold font-mono text-accent mt-1 block">
                    {packageModel === 'one-time' ? `${listResults.roti.toFixed(0)}%` : `$${listResults.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  </span>
                </div>
              </div>

              {/* DETAILS AND CHART VISUAL */}
              <div className="bg-bg-raised border border-border-dim p-5 rounded-sm space-y-5">
                <h4 className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider border-b border-border-dim pb-2.5">
                  Lead Product Feasibility & Break-Even
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cost breakdown splits */}
                  <div className="space-y-3.5 font-mono text-[11px]">
                    <div className="flex justify-between border-b border-border-dim pb-1.5">
                      <span className="text-text-secondary uppercase">Your Time valuation ({listTime} hrs @ ${hourlyRate}/hr):</span>
                      <span className="text-text-primary font-bold">${listTime * hourlyRate}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-dim pb-1.5">
                      <span className="text-text-secondary uppercase">External scraping & API costs:</span>
                      <span className="text-text-primary font-bold">${toolCosts}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-dim pb-1.5 text-accent font-bold">
                      <span className="uppercase">Break-Even threshold:</span>
                      <span>{listResults.subBreak}</span>
                    </div>
                    <div className="flex justify-between border-b border-border-dim pb-1.5">
                      <span className="text-text-secondary uppercase">{listResults.modelLabel}:</span>
                      <span className="text-text-primary font-bold">{listResults.modelCount}</span>
                    </div>
                    {packageModel === 'subscription' && (
                      <div className="flex justify-between border-b border-border-dim pb-1.5">
                        <span className="text-text-secondary uppercase">Estimated subscriber monthly churn:</span>
                        <span className="text-red-400 font-bold">{(subscribersCount * (churnRate / 100)).toFixed(1)} subscribers</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Projection Graph */}
                  <div className="bg-bg-base border border-border-dim p-4 rounded-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-text-tertiary uppercase font-bold tracking-wider block mb-2">Build Cost vs. Gross Projection</span>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-[8px] font-mono text-text-tertiary uppercase mb-1">
                            <span>Cost to build</span>
                            <span>${listResults.totalInternalBuildCost.toFixed(0)}</span>
                          </div>
                          <div className="w-full bg-bg-subtle h-2.5 border border-border-dim rounded-sm overflow-hidden">
                            <div className="bg-red-700/80 h-full" style={{ width: '40%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[8px] font-mono text-text-tertiary uppercase mb-1">
                            <span>Projected revenue</span>
                            <span>${packageModel === 'one-time' ? listResults.grossRevenue.toFixed(0) : (listResults.grossRevenue * 12).toFixed(0)}</span>
                          </div>
                          <div className="w-full bg-bg-subtle h-2.5 border border-border-dim rounded-sm overflow-hidden">
                            <div className="bg-accent h-full" style={{ width: '100%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-text-tertiary mt-2 block leading-normal pt-2 border-t border-border-dim/40">
                      You are highly profitable once you make **{listResults.subBreak}**.
                    </span>
                  </div>
                </div>

                {/* Swiss-style explanatory commentary */}
                <div className="bg-bg-base border border-border-dim p-4 rounded-sm font-sans text-xs text-text-secondary leading-relaxed space-y-2">
                  <div className="flex items-center gap-1.5 text-text-primary font-mono text-[10px] font-bold uppercase">
                    <CheckCircle className="w-3.5 h-3.5 text-accent" />
                    <span>List Packaging Blueprint Strategy</span>
                  </div>
                  {packageModel === 'one-time' ? (
                    <p>
                      Selling lists as one-off assets is a fast way to recoup labor. For **{listTime} hours** of compilation time and **${toolCosts}** software overhead, you break even on just **{listResults.breakEvenSales} sales** of a **${licensePrice}** niche database. Selling to **{licensesCount}** buyers yields a high-velocity **{listResults.roti.toFixed(0)}% Return on Time Invested (ROTI)**.
                    </p>
                  ) : (
                    <p>
                      A monthly subscription to your verified and actively-refreshed niche databases is a powerful, high-retention recurring engine. Reaching **{subscribersCount} subscribers** at **${subPrice}/mo** covers your creation build costs inside the very first month, generating an annualized recurring run-rate of **${(subPrice * subscribersCount * 12).toLocaleString()} USD**.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
