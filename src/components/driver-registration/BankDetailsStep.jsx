import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function BankDetailsStep() {
  const { register, formState: { errors }, watch } = useFormContext();
  const paymentMethod = watch('paymentMethod');

  const bankOptions = [
    'BDO',
    'BPI',
    'Metrobank',
    'PNB',
    'Security Bank',
    'UnionBank',
    'RCBC',
    'Landbank',
    'China Bank',
    'EastWest Bank'
  ];

  const eWalletOptions = [
    'GCash',
    'Maya',
    'UnionBank Online',
    'BPI Online',
    'BDO Online'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Payment Details</h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose how you want to receive your payments. You can select either a bank account or an e-wallet.
            </p>
            <div className="mt-4 rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Payment Processing</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc space-y-1 pl-5">
                      <li>Payments are processed every week</li>
                      <li>Bank transfers are free of charge</li>
                      <li>E-wallet transfers may have minimal fees</li>
                      <li>Make sure account details are accurate</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 md:col-span-2 md:mt-0">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Method
                  <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('paymentMethod', {
                    required: 'Payment method is required'
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select payment method</option>
                  <option value="bank">Bank Account</option>
                  <option value="ewallet">E-Wallet</option>
                </select>
                {errors.paymentMethod && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                )}
              </div>

              {paymentMethod === 'bank' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Bank Name
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('bankName', {
                        required: 'Bank name is required'
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select bank</option>
                      {bankOptions.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                      <option value="other">Other Bank</option>
                    </select>
                    {errors.bankName && (
                      <p className="mt-1 text-sm text-red-600">{errors.bankName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Account Name
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('accountName', {
                        required: 'Account name is required',
                        pattern: {
                          value: /^[A-Za-z\s.'-]+$/,
                          message: 'Please enter a valid account name'
                        }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter account name as shown in your bank account"
                    />
                    {errors.accountName && (
                      <p className="mt-1 text-sm text-red-600">{errors.accountName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Account Number
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('accountNumber', {
                        required: 'Account number is required',
                        pattern: {
                          value: /^\d{10,16}$/,
                          message: 'Please enter a valid account number (10-16 digits)'
                        }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter your bank account number"
                    />
                    {errors.accountNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.accountNumber.message}</p>
                    )}
                  </div>
                </>
              )}

              {paymentMethod === 'ewallet' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      E-Wallet Provider
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('eWalletProvider', {
                        required: 'E-wallet provider is required'
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select e-wallet provider</option>
                      {eWalletOptions.map(wallet => (
                        <option key={wallet} value={wallet}>{wallet}</option>
                      ))}
                    </select>
                    {errors.eWalletProvider && (
                      <p className="mt-1 text-sm text-red-600">{errors.eWalletProvider.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      E-Wallet Account Name
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('eWalletName', {
                        required: 'E-wallet account name is required',
                        pattern: {
                          value: /^[A-Za-z\s.'-]+$/,
                          message: 'Please enter a valid account name'
                        }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter the name registered with your e-wallet"
                    />
                    {errors.eWalletName && (
                      <p className="mt-1 text-sm text-red-600">{errors.eWalletName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      E-Wallet Number/ID
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('eWalletNumber', {
                        required: 'E-wallet number/ID is required',
                        pattern: {
                          value: /^(09|\+639)\d{9}$|^\d{10,16}$/,
                          message: 'Please enter a valid mobile number or account ID'
                        }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter your e-wallet mobile number or account ID"
                    />
                    {errors.eWalletNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.eWalletNumber.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      For GCash and Maya, use your registered mobile number (e.g., 09123456789)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 