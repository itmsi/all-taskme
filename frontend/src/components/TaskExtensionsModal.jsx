import React, { useState, useEffect } from 'react';
import { X, Phone, User, Building, MapPin, Camera, Mic, FileText, CheckCircle } from 'lucide-react';

const TaskExtensionsModal = ({ isOpen, onClose, taskId, initialData, onSave }) => {
  const [formData, setFormData] = useState({
    number_phone: '',
    sales_name: '',
    name_pt: '',
    iup: '',
    latitude: '',
    longitude: '',
    photo_link: '',
    count_photo: 0,
    voice_link: '',
    count_voice: 0,
    voice_transcript: '',
    is_completed: false
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        number_phone: initialData.number_phone || '',
        sales_name: initialData.sales_name || '',
        name_pt: initialData.name_pt || '',
        iup: initialData.iup || '',
        latitude: initialData.latitude || '',
        longitude: initialData.longitude || '',
        photo_link: initialData.photo_link || '',
        count_photo: initialData.count_photo || 0,
        voice_link: initialData.voice_link || '',
        count_voice: initialData.count_voice || 0,
        voice_transcript: initialData.voice_transcript || '',
        is_completed: initialData.is_completed || false
      });
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving task extensions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      number_phone: '',
      sales_name: '',
      name_pt: '',
      iup: '',
      latitude: '',
      longitude: '',
      photo_link: '',
      count_photo: 0,
      voice_link: '',
      count_voice: 0,
      voice_transcript: '',
      is_completed: false
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Task Extensions Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Phone size={20} className="text-blue-500" />
              Informasi Kontak
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={formData.number_phone}
                  onChange={(e) => handleInputChange('number_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+6281234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Sales
                </label>
                <input
                  type="text"
                  value={formData.sales_name}
                  onChange={(e) => handleInputChange('sales_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Building size={20} className="text-green-500" />
              Informasi Perusahaan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama PT/Perusahaan
                </label>
                <input
                  type="text"
                  value={formData.name_pt}
                  onChange={(e) => handleInputChange('name_pt', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="PT. Contoh Perusahaan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IUP
                </label>
                <input
                  type="text"
                  value={formData.iup}
                  onChange={(e) => handleInputChange('iup', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="IUP-001"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <MapPin size={20} className="text-red-500" />
              Informasi Lokasi
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="-6.200000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="106.816666"
                />
              </div>
            </div>
          </div>

          {/* Media Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Camera size={20} className="text-purple-500" />
              Informasi Media
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Foto
                </label>
                <input
                  type="url"
                  value={formData.photo_link}
                  onChange={(e) => handleInputChange('photo_link', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Foto
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.count_photo}
                  onChange={(e) => handleInputChange('count_photo', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Voice/Audio
                </label>
                <input
                  type="url"
                  value={formData.voice_link}
                  onChange={(e) => handleInputChange('voice_link', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/voice.mp3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah File Voice
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.count_voice}
                  onChange={(e) => handleInputChange('count_voice', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Voice Transcript */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <FileText size={20} className="text-orange-500" />
              Transkrip Suara
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transkrip Percakapan
              </label>
              <textarea
                value={formData.voice_transcript}
                onChange={(e) => handleInputChange('voice_transcript', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan transkrip percakapan atau catatan penting..."
              />
            </div>
          </div>

          {/* Completion Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              Status Penyelesaian
            </h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_completed"
                checked={formData.is_completed}
                onChange={(e) => handleInputChange('is_completed', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_completed" className="ml-2 block text-sm text-gray-700">
                Tandai sebagai selesai
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskExtensionsModal;
