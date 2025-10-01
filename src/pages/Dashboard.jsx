import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaCalendarCheck, FaShoppingCart, FaDollarSign, FaPaw, FaDog, FaCat, FaBone, FaStethoscope, FaMicroscope, FaHome, FaCut, FaGraduationCap, FaRunning } from 'react-icons/fa';
import { PetIcon, PetIconButton } from '../components/layout/PetIcons';
import StatCard from '../components/dashboard/StatCard';
import OverviewChart from '../components/dashboard/OverviewChart';
import RecentActivity from '../components/dashboard/RecentActivity';
//import UpcomingAppointments from '../components/dashboard/UpcomingAppointments';
import CalendarView from '../components/dashboard/CalendarView';
import DashboardLayout from '../components/layout/DashboardLayout';
import useApi from '../hooks/useApi';

const Dashboard = () => {
  const navigate = useNavigate();
  const api = useApi();
  const [stats, setStats] = useState({ users: 0, pets: 0, appointments: 0, providers: 0 });
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [statsData, providerTypesData] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/stats/providers-by-type')
        ]);
        
        if (isMounted && statsData) {
          setStats({
            users: Number(statsData.users) || 0,
            pets: Number(statsData.pets) || 0,
            appointments: Number(statsData.appointments) || 0,
            providers: Number(statsData.providers) || 0,
          });
        }
        
        if (isMounted && providerTypesData?.items) {
          setServiceTypes(providerTypesData.items);
        }
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
        setError('Failed to load stats');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [api]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <FaPaw className="text-indigo-600 text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            </div>
            <p className="text-gray-500 mt-1">Welcome to your PawsIQ admin dashboard</p>
          </div>
          <div className="flex gap-3">
            <PetIconButton 
              type="dog" 
              variant="secondary" 
              label="View Reports" 
              onClick={() => {
                // Navigate to analytics page
                navigate('/analytics');
              }}
            />
            <PetIconButton 
              type="cat" 
              variant="primary" 
              label="Generate Report" 
              onClick={() => {
                // Create a simple dashboard report
                const reportDate = new Date().toLocaleDateString();
                const reportData = {
                  date: reportDate,
                  petOwners: stats.users,
                  appointments: stats.appointments,
                  products: stats.pets,
                  revenue: 0,
                  activeServices: {
                    veterinary: 438,
                    grooming: 327,
                    petSitting: 215,
                    training: 189
                  }
                };
                
                // Convert to CSV
                const csvContent = `PawsIQ Dashboard Report,${reportDate}\n\n` +
                  `Pet Owners,${reportData.petOwners}\n` +
                  `Appointments,${reportData.appointments}\n` +
                  `Pets,${reportData.products}\n` +
                  `Revenue,$${reportData.revenue}\n\n` +
                  `Active Services\n` +
                  `Veterinary,${reportData.activeServices.veterinary}\n` +
                  `Grooming,${reportData.activeServices.grooming}\n` +
                  `Pet Sitting,${reportData.activeServices.petSitting}\n` +
                  `Training,${reportData.activeServices.training}\n`;
                
                // Create and download the file
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('hidden', '');
                a.setAttribute('href', url);
                a.setAttribute('download', `pawsiq-dashboard-report-${reportDate.replace(/\//g, '-')}.csv`);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            />
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pet Owners" 
          value={loading ? '...' : String(stats.users)} 
          icon={<PetIcon type="dog" size="lg" className="text-white" />} 
          change="12% from last month" 
          changeType="increase" 
          bgColor="bg-gradient-to-br from-indigo-600 to-indigo-700"
        />
        <StatCard 
          title="Appointments" 
          value={loading ? '...' : String(stats.appointments)} 
          icon={<PetIcon type="cat" size="lg" className="text-white" />} 
          change="5% from last month" 
          changeType="increase" 
          bgColor="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard 
          title="Pets" 
          value={loading ? '...' : String(stats.pets)} 
          icon={<PetIcon type="fish" size="lg" className="text-white" />} 
          change="3% from last month" 
          changeType="decrease" 
          bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard 
          title="Revenue" 
          value="$35,210" 
          icon={<PetIcon type="paw" size="lg" className="text-white" />} 
          change="8% from last month" 
          changeType="increase" 
          bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
        />
      </div>
      
      {/* Pet Services Summary - Dynamic */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-indigo-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaBone className="text-indigo-500" />
          Pet Services Summary
        </h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading service providers...</div>
        ) : serviceTypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No active service providers found</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {serviceTypes.map((service) => {
              const bgColors = {
                indigo: 'bg-indigo-50',
                purple: 'bg-purple-50',
                blue: 'bg-blue-50',
                pink: 'bg-pink-50',
                green: 'bg-green-50',
                amber: 'bg-amber-50',
                gray: 'bg-gray-50'
              };
              const iconColors = {
                indigo: 'text-indigo-600',
                purple: 'text-purple-600',
                blue: 'text-blue-600',
                pink: 'text-pink-600',
                green: 'text-green-600',
                amber: 'text-amber-600',
                gray: 'text-gray-600'
              };
              const textColors = {
                indigo: 'text-indigo-900',
                purple: 'text-purple-900',
                blue: 'text-blue-900',
                pink: 'text-pink-900',
                green: 'text-green-900',
                amber: 'text-amber-900',
                purple: 'text-purple-900',
                blue: 'text-blue-900',
                green: 'text-green-900',
                gray: 'text-gray-900'
              };
              const boldColors = {
                indigo: 'text-indigo-700',
                purple: 'text-purple-700',
                blue: 'text-blue-700',
                green: 'text-green-700',
                gray: 'text-gray-700'
              };
              const lightColors = {
                indigo: 'text-indigo-500',
                purple: 'text-purple-500',
                blue: 'text-blue-500',
                green: 'text-green-500',
                gray: 'text-gray-500'
              };
              
              const color = service.color || 'gray';
              
              return (
                <div key={service.type} className={`${bgColors[color]} rounded-lg p-4 text-center`}>
                  <div className="bg-white w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 shadow-sm">
                    {service.icon === 'stethoscope' && <FaStethoscope className={`${iconColors[color]} text-xl`} />}
                    {service.icon === 'microscope' && <FaMicroscope className={`${iconColors[color]} text-xl`} />}
                    {service.icon === 'home' && <FaHome className={`${iconColors[color]} text-xl`} />}
                    {service.icon === 'cut' && <FaCut className={`${iconColors[color]} text-xl`} />}
                    {service.icon === 'graduation-cap' && <FaGraduationCap className={`${iconColors[color]} text-xl`} />}
                    {service.icon === 'running' && <FaRunning className={`${iconColors[color]} text-xl`} />}
                  </div>
                  <h3 className={`font-semibold ${textColors[color]}`}>{service.type}</h3>
                  <p className={`text-2xl font-bold ${boldColors[color]} mt-1`}>{service.count}</p>
                  <p className={`text-xs ${lightColors[color]} mt-1`}>Active providers</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OverviewChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
      
      {/* Calendar View */}
      <div className="grid grid-cols-1 gap-6">
        <CalendarView />
      </div>
      
      {/* Pet Care Tips */}
      <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
        <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <FaPaw className="text-indigo-600" />
          Pet Care Tips of the Day
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-50">
            <div className="flex items-center gap-2 mb-2 text-indigo-600">
              <FaDog />
              <h3 className="font-medium">Dogs</h3>
            </div>
            <p className="text-gray-600 text-sm">Regular exercise is crucial for a dog's physical and mental health. Aim for at least 30 minutes of activity daily.</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-50">
            <div className="flex items-center gap-2 mb-2 text-indigo-600">
              <FaCat />
              <h3 className="font-medium">Cats</h3>
            </div>
            <p className="text-gray-600 text-sm">Provide vertical spaces for cats to climb and perch. This satisfies their natural instinct to observe from heights.</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-50">
            <div className="flex items-center gap-2 mb-2 text-indigo-600">
              <PetIcon type="rabbit" />
              <h3 className="font-medium">Small Pets</h3>
            </div>
            <p className="text-gray-600 text-sm">Small pets need daily handling to stay socialized. Spend at least 15-20 minutes interacting with them each day.</p>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;