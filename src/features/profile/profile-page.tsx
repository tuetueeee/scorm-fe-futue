import React, { useState, useEffect, useRef } from 'react';
import { Mail, Save, User as UserIcon, Camera } from 'lucide-react';
import { userApi, mediaApi, type UserProfile } from '../../services/api';

// Sử dụng Pick để lấy các trường fname, lname, email, avatarUrl từ type UserProfile
type ProfileFormData = Pick<UserProfile, 'fname' | 'lname' | 'email' | 'avatarUrl'>;

export function ProfilePage() {
  const [formData, setFormData] = useState<ProfileFormData>({
    fname: '',
    lname: '',
    email: '',
    avatarUrl: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch dữ liệu user khi vào trang
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userApi.getCurrentUser();
        const user = response.data;
        setFormData({
          fname: user.fname || '',
          lname: user.lname || '',
          email: user.email || '',
          avatarUrl: user.avatarUrl || null,
        });
      } catch (error) {
        console.error("Lỗi lấy thông tin profile:", error);
        alert('Không thể tải thông tin người dùng.');
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 2. Xử lý Upload Avatar dùng mediaApi
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await mediaApi.uploadFile(file);
      // Cập nhật preview UI với URL trả về từ backend
      setFormData((prev) => ({ ...prev, avatarUrl: response.data.url }));
      alert('Tải ảnh lên thành công. Nhấn "Lưu thay đổi" để cập nhật hồ sơ.');
    } catch (error) {
      console.error("Lỗi upload avatar:", error);
      alert('Có lỗi xảy ra khi tải ảnh lên.');
    } finally {
      setIsUploading(false);
      // Reset input để có thể chọn lại cùng 1 file nếu cần
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 3. Xử lý Submit cập nhật Profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await userApi.updateProfile({
        fname: formData.fname,
        lname: formData.lname,
        avatarUrl: formData.avatarUrl
      });
      alert('Cập nhật thông tin hồ sơ thành công!');
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      alert('Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setIsLoading(false);
    }
  };

  // Hiển thị loading khi đang lấy dữ liệu lần đầu
  if (isFetching) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-8 flex justify-center items-center h-64">
        <span className="text-gray-500 animate-pulse">Đang tải thông tin...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-8 bg-white rounded-xl shadow-sm border border-gray-100">
      
      {/* --- PHẦN HEADER: Avatar & Tên --- */}
      <div className="mb-8 border-b border-gray-200 pb-6 flex items-center space-x-5">
        
        {/* Avatar Container */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
            {isUploading ? (
              <span className="text-xs text-gray-500 animate-pulse">Đang tải...</span>
            ) : formData.avatarUrl ? (
              <img 
                src={formData.avatarUrl} 
                alt="Profile Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-10 h-10 text-gray-300" />
            )}
          </div>
          
          {/* Nút Upload Avatar */}
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Đổi ảnh đại diện"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Input file ẩn dùng để chọn ảnh */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden" 
          />
        </div>

        {/* Thông tin Tên */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {formData.lname} {formData.fname}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý thông tin cá nhân của bạn trên SCORMGO
          </p>
        </div>
      </div>
      {/* --- KẾT THÚC PHẦN HEADER --- */}

      {/* Form Cập Nhật */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="fname" className="block text-sm font-medium text-gray-700">
              First name (Tên)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="fname"
                name="fname"
                value={formData.fname}
                onChange={handleChange}
                required
                className="w-full pl-10 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Nhập tên của bạn"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="lname" className="block text-sm font-medium text-gray-700">
              Last name (Họ)
            </label>
            <input
              type="text"
              id="lname"
              name="lname"
              value={formData.lname}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Nhập họ của bạn"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email đăng nhập
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              readOnly
              disabled
              className="w-full pl-10 px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none select-none"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            Email là định danh tài khoản duy nhất của bạn để đăng nhập và không thể thay đổi.
          </p>
        </div>

        <div className="pt-6 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || isUploading}
            className="flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isLoading ? (
              <span className="inline-block animate-pulse">Đang lưu...</span>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}