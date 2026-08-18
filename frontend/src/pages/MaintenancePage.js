import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { systemAPI } from '../services/api';

const MaintenanceGuard = ({ children }) => {
  const { hasRole, loading: authLoading } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [checking, setChecking] = useState(true);
  const [lang, setLang] = useState('en'); 

  useEffect(() => {
    const checkStatus = () => {
      systemAPI.health(`?t=${Date.now()}`)
        .then(res => setIsMaintenance(res.data.maintenanceMode || false))
        .catch(() => setIsMaintenance(false))
        .finally(() => setChecking(false));
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (checking || authLoading) return null;

  
  if (isMaintenance && !hasRole('admin')) {
    return (
      <div className={`fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center font-sans overflow-hidden ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
        
        
        <button 
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="absolute top-8 right-8 z-[10000] px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-white text-xs font-semibold hover:bg-white hover:text-black transition-all duration-500 backdrop-blur-xl shadow-2xl"
        >
          {lang === 'ar' ? 'English' : 'العربية'}
        </button>

        
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#6366F1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute w-[500px] h-[500px] bg-[#6366F1]/5 blur-[120px] rounded-full" />
        
        <div className="relative z-10 text-center flex flex-col items-center">
          
          
          <div className="relative mb-10 w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 border border-white/5 rounded-full animate-pulse" />
            <div className="absolute inset-2 border border-[#6366F1]/20 rounded-full" />
            
            <span className="text-6xl relative z-10 block animate-[work_0.8s_ease-in-out_infinite] origin-bottom-right drop-shadow-2xl">
              🔨
            </span>
          </div>

         
          <h1 className="text-white text-4xl font-bold tracking-tight mb-3">
            {lang === 'en' ? (
              <>Under <span className="text-[#6366F1] drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]">Maintenance</span></>
            ) : (
              <>تحت <span className="text-[#6366F1] drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]">الصيانة</span></>
            )}
          </h1>
          
          <p className="text-gray-500 font-normal text-sm mb-12 max-w-[280px] leading-relaxed">
            {lang === 'en' 
              ? 'Optimizing the vault for your next level' 
              : 'نقوم بتطوير النظام '}
          </p>

          
          <div className="w-56 h-[3px] bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
            <div className="h-full bg-gradient-to-r from-transparent via-[#6366F1] to-transparent w-full animate-[loading_2s_infinite] absolute" />
          </div>

          
          <div className="mt-8 flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-[#6366F1] rounded-full animate-ping" />
            <span className="text-xs text-white/30 font-mono">
              {lang === 'en' ? 'System Status: Updating' : 'حالة النظام: تحديث مستمر'}
            </span>
          </div>
        </div>

       
        <style>{`
          .rtl { direction: rtl; font-family: 'Cairo', sans-serif; }
          .ltr { direction: ltr; }
          
          @keyframes work {
            0% { transform: rotate(0deg); }
            30% { transform: rotate(-35deg); }
            70% { transform: rotate(10deg); }
            100% { transform: rotate(0deg); }
          }
          
          @keyframes loading {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return children;
};

export default MaintenanceGuard;