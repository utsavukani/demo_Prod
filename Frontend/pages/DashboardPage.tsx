import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsAPI, userAPI, transactionAPI } from '../services/api';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertCircle,
  Plus,
  Zap,
  PiggyBank,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardData {
  summary: any;
  balance: number;
  widgets: string[];
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [summaryRes, balanceRes] = await Promise.all([
        analyticsAPI.getSummary('month'),
        user?.role === 'student' ? userAPI.getBalance() : Promise.resolve({ balance: 0 })
      ]);

      setData({
        summary: summaryRes,
        balance: balanceRes.balance || 0,
        widgets: summaryRes.widgets || []
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMockUPI = async () => {
    try {
      await transactionAPI.mockUPI();
      toast.success('Mock UPI transaction created!');
      loadDashboardData(); // Refresh data
    } catch (error) {
      toast.error('Failed to create mock transaction');
    }
  };

  const getSegmentColor = (segment?: string) => {
    switch (segment) {
      case 'high-earner': return 'text-purple-600 bg-purple-100';
      case 'mid-earner': return 'text-green-600 bg-green-100';
      case 'budget-conscious': return 'text-blue-600 bg-blue-100';
      case 'low-income': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSegmentTitle = (segment?: string) => {
    switch (segment) {
      case 'high-earner': return 'High Earner';
      case 'mid-earner': return 'Mid Earner';
      case 'budget-conscious': return 'Budget Conscious';
      case 'low-income': return 'Low Income';
      default: return 'Student';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const { summary, balance, widgets } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <div className="flex items-center mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSegmentColor(user?.segment)}`}>
                {getSegmentTitle(user?.segment)}
              </span>
              {user?.role === 'student' && (
                <span className="ml-3 text-sm text-gray-500">
                  Current Balance: ₹{balance.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleMockUPI}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <Zap className="h-4 w-4 mr-2" />
            Mock UPI
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{summary.summary.totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month Earned</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{summary.summary.totalEarned.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Flow</p>
              <p className={`text-2xl font-bold ${summary.summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{summary.summary.netFlow.toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${summary.summary.netFlow >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <Wallet className={`h-6 w-6 ${summary.summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Goals</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.goals.active}
              </p>
              <p className="text-sm text-gray-500">
                {summary.goals.completionRate}% complete
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Spending Overview */}
        {widgets.includes('spending-overview') && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
            <div className="space-y-3">
              {summary.spendByCategory.slice(0, 5).map((category: any) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-700">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{category.amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {category.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals Progress */}
        {widgets.includes('goals-progress') && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Goals Progress</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Total Progress</p>
                  <p className="text-xs text-gray-500">
                    ₹{summary.goals.totalProgress.toLocaleString()} of ₹{summary.goals.totalTarget.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-600">
                    {summary.goals.completionRate}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(summary.goals.completionRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Segment-specific widgets */}
        {widgets.includes('micro-savings') && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center mb-4">
              <PiggyBank className="h-5 w-5 text-pink-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Micro Savings</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Small amounts add up to big goals! Try saving ₹10 daily.
            </p>
            <div className="bg-pink-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-pink-800">
                💡 Tip: Round up your transactions to the nearest ₹10 and save the difference!
              </p>
            </div>
          </div>
        )}

        {widgets.includes('income-volatility') && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center mb-4">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Income Tracker</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Your part-time income varies. Keep a buffer for lean weeks.
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-800">
                📊 Expected this week: ₹{(summary.summary.totalEarned * 0.25).toLocaleString()} ± ₹500
              </p>
            </div>
          </div>
        )}

        {widgets.includes('budget-alerts') && (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Budget Alerts</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-orange-800">Food Budget</p>
                  <p className="text-xs text-orange-600">78% used this month</p>
                </div>
                <span className="text-sm font-bold text-orange-800">⚠️</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <Plus className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Add Transaction</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <Target className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Create Goal</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <TrendingUp className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">View Analytics</span>
          </button>
          <button 
            onClick={handleMockUPI}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <Zap className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Mock Payment</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;