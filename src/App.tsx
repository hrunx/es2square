import React, { useState, useEffect } from 'react';
import { Building2, Lightbulb, LineChart, Brain, Camera, FileText, Home, Factory, Building, GraduationCap, X, Upload, Clock, MapPin, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BuildingAssessment } from './components/BuildingAssessment';
import { DetailedAudit } from './components/DetailedAudit';
import { InitialReport } from './components/InitialReport';
import { ErrorBoundary } from './components/ErrorBoundary';
import AudenChat from './components/AudenChat';
import TranslationProvider from './components/TranslationProvider';
import { verifySupabaseConnection } from './lib/supabase';
import { AuditLevelInfo } from './components/AuditLevelInfo';
import { supabase } from './lib/supabase';

type Profile = 'residential' | 'commercial' | 'industrial' | 'educational' | null;
type ResidentialType = 'villa' | 'apartment' | 'duplex' | null;
type Step = 'type' | 'residential-type' | 'details' | 'documents' | 'report' | 'detailed-audit';

interface RoomData {
  name: string;
  area: number;
  type?: string;
  windows?: number;
  lighting_type?: string;
  num_fixtures?: number;
  ac_type?: string;
  ac_size?: number;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  floorArea: string;
  rooms: string;
  residents: string;
  electricityBills: File[];
  floorPlan: File | null;
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
        <Icon className="w-6 h-6 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold mb-2" data-i18n={title}>{title}</h3>
      <p className="text-gray-600" data-i18n={description}>{description}</p>
    </div>
  );
}

function ClientIntakeForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('type');
  const [customerType, setCustomerType] = useState<Profile>(null);
  const [residentialType, setResidentialType] = useState<ResidentialType>(null);
  const [roomData, setRoomData] = useState<RoomData[]>([]);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    floorArea: '',
    rooms: '',
    residents: '',
    electricityBills: [],
    floorPlan: null
  });

  const handleDetailsSubmit = async () => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .insert({
          name: formData.name,
          address: formData.address,
          type: customerType,
          area: parseFloat(formData.floorArea),
          construction_year: new Date().getFullYear() // Default to current year
        })
        .select('id')
        .single();

      if (error) throw error;
      
      setBuildingId(data.id);
      setStep('documents');
    } catch (error) {
      console.error('Error saving building:', error);
      // Handle error appropriately
    }
  };

  const getAuditLevel = () => {
    const area = parseFloat(formData.floorArea);
    if (!area) return 'I';
    if (area > 10000) return 'III';
    if (area > 5000) return 'II';
    return 'I';
  };

  const handleFileUpload = (type: 'bills' | 'plan') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      if (type === 'bills') {
        setFormData({ ...formData, electricityBills: Array.from(files) });
      } else {
        setFormData({ ...formData, floorPlan: files[0] });
      }
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'residential-type':
        setStep('type');
        break;
      case 'details':
        setStep(customerType === 'residential' ? 'residential-type' : 'type');
        break;
      case 'documents':
        setStep('details');
        break;
      case 'report':
        setStep('documents');
        break;
      case 'detailed-audit':
        setStep('report');
        break;
      default:
        break;
    }
  };

  const handleStartDetailedAudit = (rooms: RoomData[]) => {
    setRoomData(rooms);
    setStep('detailed-audit');
  };

  const renderCustomerTypeSelection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {window.DeepSeekTranslate?.convert('Select Customer Type') ?? 'Select Customer Type'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { id: 'residential', title: 'Residential', icon: Home, description: 'For homes and residential properties' },
          { id: 'commercial', title: 'Commercial', icon: Building, description: 'For offices and retail spaces' },
          { id: 'industrial', title: 'Industrial', icon: Factory, description: 'For factories and warehouses' },
          { id: 'educational', title: 'Educational', icon: GraduationCap, description: 'For schools and institutions' }
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setCustomerType(type.id as Profile);
              setStep(type.id === 'residential' ? 'residential-type' : 'details');
            }}
            className="relative overflow-hidden rounded-xl text-left transition-all h-64 group hover:ring-2 hover:ring-green-400"
          >
            <div className="absolute inset-0">
              <img 
                src={`https://images.unsplash.com/photo-${type.id === 'residential' ? '1600585154340-be6161a56a0c' : 
                  type.id === 'commercial' ? '1486406146926-c627a92ad1ab' :
                  type.id === 'industrial' ? '1581093458791-9f3c3900df4b' :
                  '1562774053-701939374585'}?auto=format&fit=crop&q=80`}
                alt={window.DeepSeekTranslate?.convert(type.title) ?? type.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
            </div>
            <div className="relative h-full p-6 flex flex-col justify-end">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <type.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {window.DeepSeekTranslate?.convert(type.title) ?? type.title}
                </h3>
              </div>
              <p className="text-gray-200 text-sm">
                {window.DeepSeekTranslate?.convert(type.description) ?? type.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderResidentialTypeSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setStep('type')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          {window.DeepSeekTranslate?.convert('Back') ?? 'Back'}
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {window.DeepSeekTranslate?.convert('Select Property Type') ?? 'Select Property Type'}
          </h2>
          <p className="text-gray-600">
            {window.DeepSeekTranslate?.convert('Choose your residential property type') ?? 'Choose your residential property type'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { type: 'villa', image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80', title: 'Villa' },
          { type: 'apartment', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80', title: 'Apartment' },
          { type: 'duplex', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80', title: 'Duplex' }
        ].map((option) => (
          <button
            key={option.type}
            onClick={() => {
              setResidentialType(option.type as ResidentialType);
              setStep('details');
            }}
            className="relative overflow-hidden rounded-xl aspect-square group hover:ring-2 hover:ring-green-400"
          >
            <img 
              src={option.image}
              alt={window.DeepSeekTranslate?.convert(option.title) ?? option.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-xl font-semibold text-white">
                {window.DeepSeekTranslate?.convert(option.title) ?? option.title}
              </h3>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="space-y-6">
      <AuditLevelInfo 
        level={getAuditLevel()}
        isoStandard="ISO 50001:2018 Energy Review"
        className="mb-6"
      />
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setStep(customerType === 'residential' ? 'residential-type' : 'type')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          {window.DeepSeekTranslate?.convert('Back') ?? 'Back'}
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {window.DeepSeekTranslate?.convert('Property Details') ?? 'Property Details'}
          </h2>
          <p className="text-gray-600">
            {window.DeepSeekTranslate?.convert(`Tell us about your ${customerType === 'residential' ? residentialType?.toLowerCase() : customerType}`) ?? 
            `Tell us about your ${customerType === 'residential' ? residentialType?.toLowerCase() : customerType}`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {window.DeepSeekTranslate?.convert('Full Name') ?? 'Full Name'}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={window.DeepSeekTranslate?.convert('Enter your full name') ?? 'Enter your full name'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {window.DeepSeekTranslate?.convert('Phone Number') ?? 'Phone Number'}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={window.DeepSeekTranslate?.convert('Enter your phone number') ?? 'Enter your phone number'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {window.DeepSeekTranslate?.convert('Email Address') ?? 'Email Address'}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={window.DeepSeekTranslate?.convert('Enter your email address') ?? 'Enter your email address'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {window.DeepSeekTranslate?.convert('Property Address') ?? 'Property Address'}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={window.DeepSeekTranslate?.convert('Enter property address') ?? 'Enter property address'}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {window.DeepSeekTranslate?.convert('Property Specifications') ?? 'Property Specifications'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {window.DeepSeekTranslate?.convert('Floor Area (m²)') ?? 'Floor Area (m²)'}
            </label>
            <input
              type="number"
              value={formData.floorArea}
              onChange={(e) => setFormData({...formData, floorArea: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={window.DeepSeekTranslate?.convert('Enter floor area') ?? 'Enter floor area'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {window.DeepSeekTranslate?.convert('Number of Rooms') ?? 'Number of Rooms'}
            </label>
            <input
              type="number"
              value={formData.rooms}
              onChange={(e) => setFormData({...formData, rooms: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={window.DeepSeekTranslate?.convert('Enter number of rooms') ?? 'Enter number of rooms'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {window.DeepSeekTranslate?.convert('Number of Residents') ?? 'Number of Residents'}
            </label>
            <input
              type="number"
              value={formData.residents}
              onChange={(e) => setFormData({...formData, residents: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={window.DeepSeekTranslate?.convert('Enter number of residents') ?? 'Enter number of residents'}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={handleDetailsSubmit}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {window.DeepSeekTranslate?.convert('Continue to Documents') ?? 'Continue to Documents'}
        </button>
      </div>
    </div>
  );

  const renderDocumentUpload = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setStep('details')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          {window.DeepSeekTranslate?.convert('Back') ?? 'Back'}
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {window.DeepSeekTranslate?.convert('Upload Documents') ?? 'Upload Documents'}
          </h2>
          <p className="text-gray-600">
            {window.DeepSeekTranslate?.convert('Please provide the required documentation') ?? 'Please provide the required documentation'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {window.DeepSeekTranslate?.convert('Electricity Bills') ?? 'Electricity Bills'}
          </h3>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-green-500 transition-colors">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500">
                  <span>{window.DeepSeekTranslate?.convert('Upload bills') ?? 'Upload bills'}</span>
                  <input
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={handleFileUpload('bills')}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
                <p className="pl-1">{window.DeepSeekTranslate?.convert('or drag and drop') ?? 'or drag and drop'}</p>
              </div>
              <p className="text-xs text-gray-500">
                {window.DeepSeekTranslate?.convert('Last 6-12 months (PDF or images)') ?? 'Last 6-12 months (PDF or images)'}
              </p>
            </div>
          </div>
          {formData.electricityBills.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {window.DeepSeekTranslate?.convert(`${formData.electricityBills.length} files selected`) ?? 
                `${formData.electricityBills.length} files selected`}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {window.DeepSeekTranslate?.convert('Floor Plan') ?? 'Floor Plan'}
          </h3>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-green-500 transition-colors">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500">
                  <span>{window.DeepSeekTranslate?.convert('Upload plan') ?? 'Upload plan'}</span>
                  <input
                    type="file"
                    className="sr-only"
                    onChange={handleFileUpload('plan')}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
                <p className="pl-1">{window.DeepSeekTranslate?.convert('or drag and drop') ?? 'or drag and drop'}</p>
              </div>
              <p className="text-xs text-gray-500">
                {window.DeepSeekTranslate?.convert('PDF or image format') ?? 'PDF or image format'}
              </p>
            </div>
          </div>
          {formData.floorPlan && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {window.DeepSeekTranslate?.convert('Selected:') ?? 'Selected:'} {formData.floorPlan.name}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={() => setStep('report')}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {window.DeepSeekTranslate?.convert('Generate Initial Report') ?? 'Generate Initial Report'}
        </button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'type':
        return renderCustomerTypeSelection();
      case 'residential-type':
        return renderResidentialTypeSelection();
      case 'details':
        return renderDetailsForm();
      case 'documents':
        return renderDocumentUpload();
      case 'report':
        return buildingId ? (
          <InitialReport 
            formData={formData} 
            onStartDetailedAudit={handleStartDetailedAudit}
            customerType={customerType || 'residential'}
            buildingId={buildingId}
            onBack={handleBack}
          />
        ) : (
          <div className="text-center p-4">
            <p className="text-red-600">Building ID not found. Please try again.</p>
          </div>
        );
      case 'detailed-audit':
        return buildingId ? (
          <DetailedAudit 
            customerType={customerType || 'residential'} 
            initialRoomData={roomData}
            buildingId={buildingId}
            onBack={handleBack}
          />
        ) : (
          <div className="text-center p-4">
            <p className="text-red-600">Building ID not found. Please try again.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl w-full mx-4 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
        {renderCurrentStep()}
      </div>
    </div>
  );
}

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSupabaseConnection() {
      const isConnected = await verifySupabaseConnection();
      if (!isConnected) {
        setSupabaseError('Unable to connect to Supabase. Please check your configuration.');
      }
    }
    checkSupabaseConnection();
  }, []);

  return (
    <TranslationProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        {supabaseError && (
          <div className="bg-red-50 p-4">
            <div className="max-w-7xl mx-auto flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">
                {window.DeepSeekTranslate?.convert(supabaseError) ?? supabaseError}
              </p>
            </div>
          </div>
        )}

        <main className="flex-grow">
          <div className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80"
                alt={window.DeepSeekTranslate?.convert("Background") ?? "Background"}
                className="w-full h-full object-cover opacity-10"
              />
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 relative z-10">
              <div className="text-center">
                <h1 className="text-5xl font-bold text-gray-900 mb-6" data-i18n="Transform Your Building's Energy Efficiency">
                  Transform Your Building's Energy Efficiency
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto" data-i18n="Discover how ES² can help you reduce energy costs, improve sustainability, and optimize your building's performance through our AI-powered energy solutions.">
                  Discover how ES² can help you reduce energy costs, improve sustainability, and optimize your building's performance through our AI-powered energy solutions.
                </p>
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors"
                    data-i18n="Start Energy Audit"
                  >
                    Start Energy Audit
                  </button>
                  <button 
                    className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors border border-green-600"
                    data-i18n="Learn More"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900" data-i18n="Comprehensive Energy Solutions">
                Comprehensive Energy Solutions
              </h2>
              <p className="mt-4 text-gray-600" data-i18n="Optimize your energy consumption with our advanced analysis and recommendations">
                Optimize your energy consumption with our advanced analysis and recommendations
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={Brain}
                title="AI-Powered Analysis"
                description="Advanced algorithms analyze your energy consumption patterns and identify optimization opportunities"
              />
              <FeatureCard
                icon={Camera}
                title="Smart Scanning"
                description="Use your device camera to scan and identify energy equipment for instant analysis"
              />
              <FeatureCard
                icon={Building2}
                title="Building Assessment"
                description="Comprehensive evaluation of your building's energy infrastructure and systems"
              />
              <FeatureCard
                icon={Lightbulb}
                title="Smart Recommendations"
                description="Receive personalized suggestions for energy efficiency improvements"
              />
              <FeatureCard
                icon={LineChart}
                title="Performance Tracking"
                description="Monitor and track your energy consumption and savings in real-time"
              />
              <FeatureCard
                icon={FileText}
                title="Detailed Reports"
                description="Generate comprehensive energy audit reports with actionable insights"
              />
            </div>
          </div>

          <div className="bg-green-600 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4" data-i18n="Ready to optimize your energy consumption?">
                Ready to optimize your energy consumption?
              </h2>
              <p className="text-green-100 mb-8 max-w-2xl mx-auto" data-i18n="Start your AI-powered energy audit today and discover how you can reduce costs while improving sustainability.">
                Start your AI-powered energy audit today and discover how you can reduce costs while improving sustainability.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                data-i18n="Get Started Now"
              >
                Get Started Now
              </button>
            </div>
          </div>
        </main>

        <Footer />

        {isModalOpen && (
          <ErrorBoundary>
            <ClientIntakeForm onClose={() => setIsModalOpen(false)} />
          </ErrorBoundary>
        )}

        <ErrorBoundary>
          <AudenChat />
        </ErrorBoundary>
      </div>
    
    </TranslationProvider>
  );
}

export default App;