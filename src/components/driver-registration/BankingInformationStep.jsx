import React from 'react';

export default function BankingInformationStep({ formData, onChange }) {
  const banks = [
    'BDO',
    'BPI',
    'Metrobank',
    'PNB',
    'Security Bank',
    'UnionBank',
    'RCBC',
    'Eastwest Bank',
    'China Bank',
    'LANDBANK',
    'GCash',
    'Maya',
    'Other'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Payment Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This information will be used for your earnings disbursement. Please ensure all details
                are accurate to avoid payment delays.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
          Bank Name
        </label>
        <select
          id="bankName"
          name="bankName"
          required
          value={formData.bankName}
          onChange={onChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select your bank</option>
          {banks.map((bank) => (
            <option key={bank} value={bank}>
              {bank}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Choose your preferred bank for receiving payments.
        </p>
      </div>

      <div>
        <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
          Account Number
        </label>
        <input
          type="text"
          name="accountNumber"
          id="accountNumber"
          required
          value={formData.accountNumber}
          onChange={onChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter your account number"
          pattern="[0-9]*"
          title="Please enter only numbers"
        />
        <p className="mt-1 text-sm text-gray-500">
          Enter your account number without spaces or special characters.
        </p>
      </div>

      <div>
        <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700">
          Account Holder Name
        </label>
        <input
          type="text"
          name="accountHolder"
          id="accountHolder"
          required
          value={formData.accountHolder}
          onChange={onChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter the name as it appears on your account"
        />
        <p className="mt-1 text-sm text-gray-500">
          Enter the complete name as it appears on your bank account.
        </p>
      </div>

      <div className="rounded-md bg-yellow-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>The account must be under your name</li>
                <li>Double-check all banking details before submission</li>
                <li>Changes to banking information may take 5-7 business days to process</li>
                <li>We recommend using a savings account for faster processing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 