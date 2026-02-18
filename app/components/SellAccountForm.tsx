// src/components/SellAccountForm.tsx
"use client";

import React, { useState } from 'react';
import Wrapper from './Wrapper';

type Step = 'add-account' | 'credentials' | 'review';

interface ProductData {
  category: string;
  name: string;
  description: string;
  price: string;
  releaseOption: 'auto' | 'manual';
}

interface AccountData {
  username: string;
  password: string;
  email?: string;
  emailPassword?: string;
  additionalInfo?: string;
  previewLink?: string;
}

const SellAccountForm: React.FC = () => {
  const [step, setStep] = useState<Step>('add-account');
  const [productData, setProductData] = useState<ProductData>({
    category: '',
    name: '',
    description: '',
    price: '',
    releaseOption: 'auto',
  });
  const [accounts, setAccounts] = useState<AccountData[]>([
    {
      username: '',
      password: '',
      email: '',
      emailPassword: '',
      additionalInfo: '',
      previewLink: '',
    },
  ]);

  const updateProduct = (field: keyof ProductData, value: string) => {
    setProductData((prev) => ({ ...prev, [field]: value }));
  };

  const updateAccount = (index: number, field: keyof AccountData, value: string) => {
    setAccounts((prev) =>
      prev.map((acc, i) => (i === index ? { ...acc, [field]: value } : acc))
    );
  };

  const addAccount = () => {
    setAccounts((prev) => [
      ...prev,
      {
        username: '',
        password: '',
        email: '',
        emailPassword: '',
        additionalInfo: '',
        previewLink: '',
      },
    ]);
  };

  const nextStep = () => {
    if (step === 'add-account') setStep('credentials');
    else if (step === 'credentials') setStep('review');
  };

  const prevStep = () => {
    if (step === 'review') setStep('credentials');
    else if (step === 'credentials') setStep('add-account');
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/admin/sell-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productData, accounts }),
      });

      if (response.ok) {
        alert('Account submitted for review!');
        // Reset form
        setStep('add-account');
        setProductData({
          category: '',
          name: '',
          description: '',
          price: '',
          releaseOption: 'auto',
        });
        setAccounts([{
          username: '',
          password: '',
          email: '',
          emailPassword: '',
          additionalInfo: '',
          previewLink: '',
        }]);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit. Please try again.');
    }
  };

  const steps = [
    { id: 'add-account', label: 'Add account', icon: '✓' },
    { id: 'credentials', label: 'Credentials', icon: '✓' },
    { id: 'review', label: 'Review', icon: '✓' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Sell your account</h1>
          <p className="mt-2 text-gray-600">
            Add any account to sell to thousands of customers on our platform
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-12">
          <div className="flex justify-between items-center relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
              <div
                className="h-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {steps.map((s, index) => (
              <div key={s.id} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold transition-all
                    ${index <= currentStepIndex ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  {index < currentStepIndex ? '✓' : index + 1}
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Warning Banner - shown on credentials & review */}
        {(step === 'credentials' || step === 'review') && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <strong>Warning:</strong> You are in <strong>DEFAULT PLAN</strong>, your account upload limit
            number for today is {step === 'credentials' ? '0' : '1'}. If you want to upload more
            accounts, upgrade your plan.{' '}
            <a href="#" className="underline font-medium">
              Choose Your Plan Here
            </a>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white shadow rounded-xl p-8">
          {step === 'add-account' && (
            <>
              <h2 className="text-2xl font-semibold mb-6">Add Account</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Account Category
                  </label>
                  <select
                    value={productData.category}
                    onChange={(e) => updateProduct('category', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Account Category</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="gmail">Gmail</option>
                    <option value="twitter">Twitter / X</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="e.g., 4 Years Facebook Account"
                    value={productData.name}
                    onChange={(e) => updateProduct('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={4}
                    placeholder="Perfect for products that need login..."
                    value={productData.description}
                    onChange={(e) => updateProduct('description', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      placeholder="Enter your price"
                      value={productData.price}
                      onChange={(e) => updateProduct('price', e.target.value)}
                      className="w-full pl-10 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Release Options</label>
                  <div className="space-y-4">
                    <label className="relative flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="release"
                        checked={productData.releaseOption === 'auto'}
                        onChange={() => updateProduct('releaseOption', 'auto')}
                        className="mt-1 h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">Auto Confirm Order</p>
                        <p className="text-sm text-gray-600">
                          Recommended — Perfect for products that don&apos;t need your attention.
                        </p>
                      </div>
                    </label>

                    <label className="relative flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="release"
                        checked={productData.releaseOption === 'manual'}
                        onChange={() => updateProduct('releaseOption', 'manual')}
                        className="mt-1 h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">Manual Release</p>
                        <p className="text-sm text-gray-600">
                          Ideal for products that need your input — like 2FA, codes, etc.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  onClick={nextStep}
                  disabled={!productData.category || !productData.name || !productData.price}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 'credentials' && (
            <>
              <h2 className="text-2xl font-semibold mb-6">Account Credentials</h2>

              {/* Product Summary */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    C
                  </div>
                  <div>
                    <h3 className="font-semibold">{productData.name || 'Account Name'}</h3>
                    <p className="text-green-600 font-bold">${productData.price || '0'}</p>
                    <p className="text-sm text-gray-500">Delivery in Minutes</p>
                  </div>
                </div>
              </div>

              {/* Accounts */}
              <div className="space-y-8">
                {accounts.map((account, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Account {index + 1}</h3>
                      {accounts.length > 1 && (
                        <button
                          onClick={() => setAccounts(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                          <input
                            type="text"
                            value={account.username}
                            onChange={(e) => updateAccount(index, 'username', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Password
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              value={account.password}
                              onChange={(e) => updateAccount(index, 'password', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">👁</button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Preview link of account (optional)
                          </label>
                          <input
                            type="url"
                            value={account.previewLink}
                            onChange={(e) => updateAccount(index, 'previewLink', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Email attached to account
                          </label>
                          <input
                            type="email"
                            value={account.email}
                            onChange={(e) => updateAccount(index, 'email', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Email Password</label>
                          <div className="relative">
                            <input
                              type="password"
                              value={account.emailPassword}
                              onChange={(e) => updateAccount(index, 'emailPassword', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                              👁
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Additional information
                          </label>
                          <textarea
                            value={account.additionalInfo}
                            onChange={(e) => updateAccount(index, 'additionalInfo', e.target.value)}
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex justify-between">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <div className="space-x-4">
                  <button
                    onClick={addAccount}
                    className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition"
                  >
                    Add another account
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={accounts.some(acc => !acc.username || !acc.password)}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 transition"
                  >
                    Review
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              <h2 className="text-2xl font-semibold mb-8 text-center">Review Accounts</h2>

              <div className="max-w-4xl mx-auto bg-gray-50 p-8 rounded-xl border border-gray-200">
                <div className="flex items-center gap-5 mb-8 pb-6 border-b">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    C
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{productData.name || 'Account Name'}</h3>
                    <p className="text-green-600 font-bold text-lg">${productData.price || '0'}</p>
                    <p className="text-gray-600">Delivery in Minutes</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {accounts.map((account, index) => (
                    <div key={index} className="bg-white p-5 rounded-lg border">
                      <h4 className="font-semibold mb-3">Account {index + 1}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Email / UserName</p>
                          <p className="font-medium">{account.email || account.username}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Password</p>
                          <p className="font-medium">••••••••••</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 flex justify-center gap-6">
                <button
                  onClick={prevStep}
                  className="px-8 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-12 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition shadow-md"
                >
                  Submit
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellAccountForm;