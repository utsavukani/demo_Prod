export const determineSegment = (onboardingData) => {
  const { allowanceAmount = 0, hasPartTimeJob = false } = onboardingData;
  
  // High Part-Time Earners: Has job + high allowance OR very high allowance
  if ((hasPartTimeJob && allowanceAmount >= 8000) || allowanceAmount >= 15000) {
    return 'high-earner';
  }
  
  // Mid Part-Time Earners: Has job with moderate allowance OR moderate-high allowance
  if ((hasPartTimeJob && allowanceAmount >= 3000) || (allowanceAmount >= 5000 && allowanceAmount < 15000)) {
    return 'mid-earner';
  }
  
  // Budget-Conscious: Moderate allowance, no job, likely careful spenders
  if (!hasPartTimeJob && allowanceAmount >= 4000 && allowanceAmount < 8000) {
    return 'budget-conscious';
  }
  
  // Low-Income Dependents: Low allowance, no job
  return 'low-income';
};

export const getPersonalizedWidgets = (segment) => {
  const baseWidgets = ['spending-overview', 'recent-transactions', 'goals-progress'];
  
  switch (segment) {
    case 'high-earner':
      return [...baseWidgets, 'income-volatility', 'investment-suggestions'];
    case 'mid-earner':
      return [...baseWidgets, 'budget-alerts', 'saving-streaks'];
    case 'budget-conscious':
      return [...baseWidgets, 'spend-alerts', 'micro-savings', 'budget-tracker'];
    case 'low-income':
      return [...baseWidgets, 'micro-savings', 'allowance-tracker', 'saving-tips'];
    default:
      return baseWidgets;
  }
};