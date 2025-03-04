import React from 'react';

export default function PaymentOptions({ paymentMethod, setPaymentMethod }) {
  const handlePaymentMethodChange = (value) => {
    console.log('Payment method selected:', value);
    setPaymentMethod(value);
  };

  const options = [
    {
      id: 'online',
      name: 'Online Payment',
      iconPlaceholder: '💳',
      description: 'Pay with GCash or Credit Card'
    }
  ];

  React.useEffect(() => {
    if (!paymentMethod) {
      setPaymentMethod('online');
    }
  }, [paymentMethod, setPaymentMethod]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
      {options.map((method) => (
        <label
          key={method.id}
          className={`
            relative border rounded-lg p-5 sm:p-4 cursor-pointer flex items-center space-x-3
            ${paymentMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          `}
        >
          <input
            type="radio"
            name="payment"
            value={method.id}
            checked={paymentMethod === method.id}
            onChange={(e) => handlePaymentMethodChange(e.target.value)}
            className="sr-only"
          />
          <div className="flex-shrink-0 text-2xl">
            {method.iconPlaceholder}
          </div>
          <div className="flex-1">
            <span className="font-medium block">{method.name}</span>
            <span className="text-sm text-gray-500">{method.description}</span>
          </div>
        </label>
      ))}
    </div>
  );
} 