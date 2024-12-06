// app/loading.tsx
export default function Loading() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="text-4xl font-bold text-blue-600 mb-8">
          CurioPay
        </div>
        
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
        </div>
  
        <div className="mt-4 text-slate-600 text-lg animate-pulse">
          Loading your financial dashboard...
        </div>
  
        <div className="absolute bottom-8 flex space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }