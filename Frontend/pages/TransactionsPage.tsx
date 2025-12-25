import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../services/api';
import { 
  Plus, 
  MessageSquare, 
  Zap, 
  Filter, 
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Edit3,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Transaction {
  _id: string;
  amount: number;
  direction: 'debit' | 'credit';
  method: string;
  merchant?: string;
  note?: string;
  timestamp: string;
  category: string;
  confidence: number;
  isConfirmed: boolean;
}

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    amount: '',
    direction: 'debit' as 'debit' | 'credit',
    method: 'UPI',
    merchant: '',
    note: '',
    category: ''
  });

  const [smsText, setSmsText] = useState('');

  const categories = ['Food', 'Transport', 'Academic', 'Entertainment', 'Shopping', 'Bills', 'Other'];

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await transactionAPI.getTransactions({ limit: 50 });
      setTransactions(response.transactions);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await transactionAPI.createTransaction({
        ...formData,
        amount: parseFloat(formData.amount),
        rawSource: 'manual'
      });
      
      toast.success('Transaction added successfully!');
      setShowAddModal(false);
      setFormData({
        amount: '',
        direction: 'debit',
        method: 'UPI',
        merchant: '',
        note: '',
        category: ''
      });
      loadTransactions();
    } catch (error) {
      toast.error('Failed to add transaction');
    }
  };

  const handleParseSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await transactionAPI.parseSMS(smsText);
      toast.success('SMS parsed and transaction created!');
      setShowSMSModal(false);
      setSmsText('');
      loadTransactions();
    } catch (error) {
      toast.error('Failed to parse SMS');
    }
  };

  const handleMockUPI = async () => {
    try {
      await transactionAPI.mockUPI();
      toast.success('Mock UPI transaction created!');
      loadTransactions();
    } catch (error) {
      toast.error('Failed to create mock transaction');
    }
  };

  const handleUpdateCategory = async (transactionId: string, category: string) => {
    try {
      await transactionAPI.updateCategory(transactionId, category);
      toast.success('Category updated!');
      setEditingCategory(null);
      loadTransactions();
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Food: 'bg-orange-100 text-orange-800',
      Transport: 'bg-blue-100 text-blue-800',
      Academic: 'bg-purple-100 text-purple-800',
      Entertainment: 'bg-pink-100 text-pink-800',
      Shopping: 'bg-green-100 text-green-800',
      Bills: 'bg-red-100 text-red-800',
      Other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.Other;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Manual
          </button>
          <button
            onClick={() => setShowSMSModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Parse SMS
          </button>
          <button
            onClick={handleMockUPI}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center"
          >
            <Zap className="h-4 w-4 mr-2" />
            Mock UPI
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No transactions yet. Add your first transaction!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <div key={transaction._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      transaction.direction === 'credit' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.direction === 'credit' ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {transaction.merchant || 'Unknown Merchant'}
                        </p>
                        <span className="text-xs text-gray-500">
                          {transaction.method}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{transaction.note}</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.timestamp)}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${
                      transaction.direction === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.direction === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </p>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      {editingCategory === transaction._id ? (
                        <div className="flex items-center space-x-1">
                          <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="">Select category</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleUpdateCategory(transaction._id, newCategory)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                            {transaction.category}
                          </span>
                          {!transaction.isConfirmed && (
                            <button
                              onClick={() => {
                                setEditingCategory(transaction._id);
                                setNewCategory(transaction.category);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {!transaction.isConfirmed && (
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
                        <span className="text-xs text-yellow-600">
                          {Math.round(transaction.confidence * 100)}% confident
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Transaction</h2>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, direction: 'debit' })}
                    className={`p-2 rounded-lg border text-sm font-medium ${
                      formData.direction === 'debit'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, direction: 'credit' })}
                    className={`p-2 rounded-lg border text-sm font-medium ${
                      formData.direction === 'credit'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Method
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Merchant
                </label>
                <input
                  type="text"
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Swiggy, Uber, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Lunch, cab fare, etc."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Add Transaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMS Parse Modal */}
      {showSMSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Parse SMS</h2>
            <form onSubmit={handleParseSMS} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMS Text
                </label>
                <textarea
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Paste your bank SMS here..."
                  required
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Sample SMS:</strong><br />
                  "Rs.250.00 debited from A/c **1234 on 15-Jan-24 at SWIGGY BANGALORE UPI:123456789"
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Parse SMS
                </button>
                <button
                  type="button"
                  onClick={() => setShowSMSModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;