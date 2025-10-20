import React from 'react';
import { 
  Phone, 
  User, 
  Building, 
  MapPin, 
  Camera, 
  Mic, 
  FileText, 
  CheckCircle, 
  XCircle,
  Edit3,
  ExternalLink
} from 'lucide-react';

const TaskExtensionsDisplay = ({ extensions, onEdit, canEdit = false }) => {
  if (!extensions) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500 mb-4">Belum ada data extensions untuk task ini</p>
        {canEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit3 size={16} className="mr-2" />
            Tambah Data Extensions
          </button>
        )}
      </div>
    );
  }

  const hasAnyData = Object.values(extensions).some(value => 
    value !== null && value !== '' && value !== 0
  );

  if (!hasAnyData) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500 mb-4">Data extensions kosong</p>
        {canEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit3 size={16} className="mr-2" />
            Edit Data Extensions
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Task Extensions</h3>
        {canEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-words rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit3 size={14} className="mr-1" />
            Edit
          </button>
        )}
      </div>

      {/* Contact Information */}
      {(extensions.number_phone || extensions.sales_name) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <Phone size={18} className="text-blue-500 mr-2" />
            Informasi Kontak
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {extensions.number_phone && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nomor Telepon
                </label>
                <p className="text-sm text-gray-900">{extensions.number_phone}</p>
              </div>
            )}
            {extensions.sales_name && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nama Sales
                </label>
                <p className="text-sm text-gray-900">{extensions.sales_name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Company Information */}
      {(extensions.name_pt || extensions.iup) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <Building size={18} className="text-green-500 mr-2" />
            Informasi Perusahaan
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {extensions.name_pt && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nama PT/Perusahaan
                </label>
                <p className="text-sm text-gray-900">{extensions.name_pt}</p>
              </div>
            )}
            {extensions.iup && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  IUP
                </label>
                <p className="text-sm text-gray-900">{extensions.iup}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Information */}
      {(extensions.latitude || extensions.longitude) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <MapPin size={18} className="text-red-500 mr-2" />
            Informasi Lokasi
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {extensions.latitude && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Latitude
                </label>
                <p className="text-sm text-gray-900">{extensions.latitude}</p>
              </div>
            )}
            {extensions.longitude && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Longitude
                </label>
                <p className="text-sm text-gray-900">{extensions.longitude}</p>
              </div>
            )}
          </div>
          {(extensions.latitude && extensions.longitude) && (
            <div className="mt-3">
              <a
                href={`https://www.google.com/maps?q=${extensions.latitude},${extensions.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink size={14} className="mr-1" />
                Lihat di Google Maps
              </a>
            </div>
          )}
        </div>
      )}

      {/* Media Information */}
      {(extensions.photo_link || extensions.count_photo || extensions.voice_link || extensions.count_voice) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <Camera size={18} className="text-purple-500 mr-2" />
            Informasi Media
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {extensions.photo_link && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Link Foto
                </label>
                <a
                  href={extensions.photo_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink size={14} className="mr-1" />
                  Lihat Foto
                </a>
              </div>
            )}
            {extensions.count_photo > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Jumlah Foto
                </label>
                <p className="text-sm text-gray-900">{extensions.count_photo} foto</p>
              </div>
            )}
            {extensions.voice_link && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Link Voice/Audio
                </label>
                <a
                  href={extensions.voice_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Mic size={14} className="mr-1" />
                  Dengarkan Audio
                </a>
              </div>
            )}
            {extensions.count_voice > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Jumlah File Voice
                </label>
                <p className="text-sm text-gray-900">{extensions.count_voice} file</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voice Transcript */}
      {extensions.voice_transcript && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <FileText size={18} className="text-orange-500 mr-2" />
            Transkrip Suara
          </h4>
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {extensions.voice_transcript}
            </p>
          </div>
        </div>
      )}

      {/* Completion Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
          <CheckCircle size={18} className="text-green-500 mr-2" />
          Status Penyelesaian
        </h4>
        <div className="flex items-center">
          {extensions.is_completed ? (
            <>
              <CheckCircle size={20} className="text-green-500 mr-2" />
              <span className="text-sm font-medium text-green-700">Selesai</span>
            </>
          ) : (
            <>
              <XCircle size={20} className="text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Belum Selesai</span>
            </>
          )}
        </div>
      </div>

      {/* Timestamps */}
      {(extensions.extension_created_at || extensions.extension_updated_at) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Informasi Timestamp</h4>
          <div className="text-xs text-gray-500 space-y-1">
            {extensions.extension_created_at && (
              <p>Dibuat: {new Date(extensions.extension_created_at).toLocaleString('id-ID')}</p>
            )}
            {extensions.extension_updated_at && (
              <p>Diupdate: {new Date(extensions.extension_updated_at).toLocaleString('id-ID')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskExtensionsDisplay;
