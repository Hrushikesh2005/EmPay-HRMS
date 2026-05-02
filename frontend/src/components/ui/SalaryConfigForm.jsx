import { useState, useEffect } from "react";
import { setEmployeeSalary } from "../../services/employees";
import toast from "react-hot-toast";

// Helper for INR currency formatting
const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);

export function SalaryConfigForm({ employeeId, onSuccess }) {
  const [monthlyWage, setMonthlyWage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const [breakdown, setBreakdown] = useState({
    yearly: 0,
    basic: 0,
    hra: 0,
    standard: 0,
    performance: 0,
    lta: 0,
    fixed: 0,
    pf: 0,
    pt: 200, // Fixed
  });

  // Strict cascading logic
  useEffect(() => {
    const wage = parseFloat(monthlyWage) || 0;
    
    if (wage > 0) {
      const basic = wage * 0.50;
      const hra = basic * 0.50;
      const standard = basic * 0.1667;
      const performance = basic * 0.0833;
      const lta = basic * 0.0833;
      
      const fixed = wage - (basic + hra + standard + performance + lta);
      const pf = basic * 0.12;

      setBreakdown({
        yearly: wage * 12,
        basic,
        hra,
        standard,
        performance,
        lta,
        fixed: Math.max(0, fixed), // Prevent negative if rounding drifts slightly
        pf,
        pt: 200,
      });
    } else {
      setBreakdown({
        yearly: 0, basic: 0, hra: 0, standard: 0, performance: 0,
        lta: 0, fixed: 0, pf: 0, pt: 200,
      });
    }
  }, [monthlyWage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monthlyWage || parseFloat(monthlyWage) <= 0) {
      toast.error("Please enter a valid monthly wage.");
      return;
    }

    setIsSaving(true);
    try {
      // payload mappings: other_allowances is the sum of standard, performance, lta, and fixed
      const otherAllowances = breakdown.standard + breakdown.performance + breakdown.lta + breakdown.fixed;
      
      await setEmployeeSalary(employeeId, {
        basic_salary: breakdown.basic,
        hra: breakdown.hra,
        other_allowances: otherAllowances,
        pf_employee_pct: 12.0,
        pf_employer_pct: 12.0,
        professional_tax: breakdown.pt,
      });
      
      toast.success("Salary structure saved successfully.");
      if (onSuccess) onSuccess();
      setMonthlyWage("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save salary structure.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 max-w-2xl">
      <h3 className="text-lg font-semibold text-slate-800 mb-1">Configure Salary Structure</h3>
      <p className="text-sm text-slate-500 mb-6">Enter the Gross Monthly Wage to auto-calculate all standard components.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Gross Monthly Wage (CTC)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              className="pl-8 w-full md:w-1/2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g. 50000"
              value={monthlyWage}
              onChange={(e) => setMonthlyWage(e.target.value)}
            />
          </div>
        </div>

        {monthlyWage > 0 && (
          <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-sm font-semibold text-slate-700">Calculated Breakdown</span>
              <span className="text-xs text-slate-500">Yearly: {formatCurrency(breakdown.yearly)}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Basic Salary (50%)</label>
                <input type="text" disabled value={formatCurrency(breakdown.basic)} className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-700 font-medium cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">HRA (50% of Basic)</label>
                <input type="text" disabled value={formatCurrency(breakdown.hra)} className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-700 font-medium cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Standard Allowance</label>
                <input type="text" disabled value={formatCurrency(breakdown.standard)} className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-700 font-medium cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Leave Travel (LTA)</label>
                <input type="text" disabled value={formatCurrency(breakdown.lta)} className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-700 font-medium cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Performance Bonus</label>
                <input type="text" disabled value={formatCurrency(breakdown.performance)} className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-700 font-medium cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fixed Allowance (Residual)</label>
                <input type="text" disabled value={formatCurrency(breakdown.fixed)} className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-700 font-medium cursor-not-allowed" />
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">PF Deductions (12%)</label>
                <input type="text" disabled value={formatCurrency(breakdown.pf)} className="w-full px-3 py-1.5 bg-red-50 border border-red-100 rounded-md text-sm text-red-700 font-medium cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Professional Tax</label>
                <input type="text" disabled value={formatCurrency(breakdown.pt)} className="w-full px-3 py-1.5 bg-red-50 border border-red-100 rounded-md text-sm text-red-700 font-medium cursor-not-allowed" />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving || !monthlyWage}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Save Salary Structure
          </button>
        </div>
      </form>
    </div>
  );
}
