export const calculateEMI = (
  principal: number,
  rate: number,
  tenure: number
) => {
  const r = rate / 12 / 100;

  const emi =
    (principal * r * Math.pow(1 + r, tenure)) /
    (Math.pow(1 + r, tenure) - 1);

  return Math.round(emi);
};

export const generateSchedule = (
  principal: number,
  rate: number,
  tenure: number
) => {
  const emi = calculateEMI(principal, rate, tenure);

  const schedule = [];
  let date = new Date();

  for (let i = 0; i < tenure; i++) {
    date.setMonth(date.getMonth() + 1);

    schedule.push({
      dueDate: new Date(date),
      amount: emi,
      paidAmount: 0,
      status: "pending"
    });
  }

  return { emi, schedule };
};