import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  EyeIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  IdentificationIcon,
  TruckIcon,
  DocumentTextIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

export default function DriverApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedApp, setSelectedApp] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      // First check if user has admin access
      const { data: adminData, error: adminError } = await supabase
        .from('admin_access')
        .select('is_super_admin')
        .eq('user_id', (await supabase.auth.getUser()).data.user.id)
        .single();

      if (adminError) {
        console.error('Admin check error:', adminError);
        throw new Error('Failed to verify admin status');
      }

      if (!adminData?.is_super_admin) {
        toast.error('You do not have permission to view applications');
        setLoading(false);
        return;
      }

      // If admin, fetch applications
      const { data, error } = await supabase
        .from('driver_applications')
        .select('*')
        .eq('status', filter)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Applications fetch error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const reviewerIds = data
          .filter(app => app.reviewed_by)
          .map(app => app.reviewed_by);

        if (reviewerIds.length > 0) {
          const { data: reviewers, error: reviewerError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', reviewerIds);

          if (!reviewerError && reviewers) {
            data.forEach(app => {
              if (app.reviewed_by) {
                const reviewer = reviewers.find(r => r.id === app.reviewed_by);
                app.reviewer = reviewer;
              }
            });
          }
        }
      }

      console.log('Fetched applications:', data); // Debug log
      setApplications(data || []);
    } catch (error) {
      console.error('Full error:', error);
      toast.error('Failed to fetch applications. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data?.user?.id) throw new Error('No user found');

      const { error } = await supabase
        .from('driver_applications')
        .update({ 
          status: newStatus,
          notes: notes,
          reviewed_by: user.data.user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast.success(`Application ${newStatus} successfully`);
      fetchApplications();
      setSelectedApp(null);
      setNotes('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update application');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Driver Applications</h1>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="mt-2 text-sm text-gray-600">
                Manage and review driver applications for IslaGO
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="pending">🕒 Pending Review</option>
                <option value="approved">✅ Approved</option>
                <option value="rejected">❌ Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              {filter === 'pending' ? <ClockIcon /> : 
               filter === 'approved' ? <CheckCircleIcon /> : <XCircleIcon />}
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No {filter} applications</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no applications with {filter} status at the moment.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle Information
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-lg font-medium text-gray-600">
                              {app.full_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{app.full_name}</div>
                            <div className="text-sm text-gray-500">{app.email}</div>
                            <div className="text-sm text-gray-500">{app.mobile_number}</div>
                            <div className="text-sm text-gray-500">{app.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {app.vehicle_year} {app.vehicle_make} {app.vehicle_model}
                        </div>
                        <div className="text-sm text-gray-500">
                          Plate: {app.plate_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          Color: {app.vehicle_color}
                        </div>
                        <div className="text-sm text-gray-500">
                          OR/CR Number: {app.or_cr_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          {app.driver_license_url && (
                            <a
                              href={app.driver_license_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              License
                            </a>
                          )}
                          {app.or_cr_url && (
                            <a
                              href={app.or_cr_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              OR/CR
                            </a>
                          )}
                          {app.insurance_url && (
                            <a
                              href={app.insurance_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              Insurance
                            </a>
                          )}
                          {app.nbi_clearance_url && (
                            <a
                              href={app.nbi_clearance_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              NBI Clearance
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${app.status === 'pending' && 'bg-yellow-100 text-yellow-800'}
                          ${app.status === 'approved' && 'bg-green-100 text-green-800'}
                          ${app.status === 'rejected' && 'bg-red-100 text-red-800'}
                        `}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                        {app.reviewed_at && (
                          <div className="text-xs text-gray-500 mt-2">
                            Reviewed on {format(new Date(app.reviewed_at), 'MMM d, yyyy')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {app.status === 'pending' && (
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Review Application
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {selectedApp && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full m-4 p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Review Application for {selectedApp.full_name}
              </h3>

              {/* Application Details Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Personal Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <IdentificationIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h4 className="font-medium text-gray-900">Personal Information</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Full Name:</span> {selectedApp.full_name}</p>
                    <p className="text-sm"><span className="font-medium">Email:</span> {selectedApp.email}</p>
                    <p className="text-sm"><span className="font-medium">Mobile:</span> {selectedApp.mobile_number}</p>
                    <p className="text-sm"><span className="font-medium">Address:</span> {selectedApp.address}</p>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <TruckIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h4 className="font-medium text-gray-900">Vehicle Information</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Make:</span> {selectedApp.vehicle_make}</p>
                    <p className="text-sm"><span className="font-medium">Model:</span> {selectedApp.vehicle_model}</p>
                    <p className="text-sm"><span className="font-medium">Year:</span> {selectedApp.vehicle_year}</p>
                    <p className="text-sm"><span className="font-medium">Color:</span> {selectedApp.vehicle_color}</p>
                    <p className="text-sm"><span className="font-medium">Plate Number:</span> {selectedApp.plate_number}</p>
                    <p className="text-sm"><span className="font-medium">OR/CR Number:</span> {selectedApp.or_cr_number}</p>
                  </div>
                </div>

                {/* License & LTFRB Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h4 className="font-medium text-gray-900">License & LTFRB Details</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">License Number:</span> {selectedApp.license_number}</p>
                    <p className="text-sm"><span className="font-medium">License Type:</span> {selectedApp.license_type}</p>
                    <p className="text-sm"><span className="font-medium">Expiration:</span> {selectedApp.license_expiration}</p>
                    <p className="text-sm"><span className="font-medium">TNVS Number:</span> {selectedApp.tnvs_number}</p>
                    <p className="text-sm"><span className="font-medium">CPC Number:</span> {selectedApp.cpc_number}</p>
                  </div>
                </div>

                {/* Insurance & Banking */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <BanknotesIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h4 className="font-medium text-gray-900">Insurance & Banking</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Insurance Provider:</span> {selectedApp.insurance_provider}</p>
                    <p className="text-sm"><span className="font-medium">Policy Number:</span> {selectedApp.policy_number}</p>
                    <p className="text-sm"><span className="font-medium">Policy Expiration:</span> {selectedApp.policy_expiration}</p>
                    <p className="text-sm"><span className="font-medium">Bank Name:</span> {selectedApp.bank_name}</p>
                    <p className="text-sm"><span className="font-medium">Account Holder:</span> {selectedApp.account_holder}</p>
                    <p className="text-sm"><span className="font-medium">Account Number:</span> {selectedApp.account_number}</p>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Uploaded Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedApp.driver_license_url && (
                    <a
                      href={selectedApp.driver_license_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 bg-white rounded-md hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm text-blue-600">Driver's License</span>
                    </a>
                  )}
                  {selectedApp.or_cr_url && (
                    <a
                      href={selectedApp.or_cr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 bg-white rounded-md hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm text-blue-600">OR/CR</span>
                    </a>
                  )}
                  {selectedApp.insurance_url && (
                    <a
                      href={selectedApp.insurance_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 bg-white rounded-md hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm text-blue-600">Insurance</span>
                    </a>
                  )}
                  {selectedApp.nbi_clearance_url && (
                    <a
                      href={selectedApp.nbi_clearance_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 bg-white rounded-md hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm text-blue-600">NBI Clearance</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  className="w-full h-32 p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateApplicationStatus(selectedApp.id, 'rejected')}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => updateApplicationStatus(selectedApp.id, 'approved')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Approve Application
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}