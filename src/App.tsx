import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Image as ImageIcon, Loader2, Settings2, Lock, LayoutGrid, Sparkles } from 'lucide-react';
import { PerlerBeadGenerator, Algorithm } from './core/generator';
import { PaletteKey, brandNames } from './core/color_utils';
import { getBrowserFingerprint } from './core/fingerprint';

type Tab = 'base' | 'advanced';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('base');
  
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [licenseKey, setLicenseKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const [image, setImage] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(40);
  const [height, setHeight] = useState<number>(40);
  const [algorithm, setAlgorithm] = useState<Algorithm>('average');
  const [palette, setPalette] = useState<PaletteKey>('mard');
  const [brightness, setBrightness] = useState<number>(0);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const savedKey = localStorage.getItem('perler_license');
      if (savedKey) {
        try {
          const fp = await getBrowserFingerprint();
          const res = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: savedKey, fingerprint: fp })
          });
          const data = await res.json();
          if (data.success) {
            setIsAuth(true);
          } else {
            localStorage.removeItem('perler_license');
          }
        } catch (e) {
          console.error(e);
        }
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const handleActivate = async () => {
    if (!licenseKey.trim()) return;
    setIsActivating(true);
    setAuthError('');
    try {
      const fp = await getBrowserFingerprint();
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: licenseKey.trim(), fingerprint: fp })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('perler_license', licenseKey.trim());
        setIsAuth(true);
      } else {
        setAuthError(data.error || '验证失败');
      }
    } catch (e) {
      setAuthError('网络错误，请重试');
    } finally {
      setIsActivating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!image) return;
    
    const w = Math.min(Math.max(1, width), 120);
    const h = Math.min(Math.max(1, height), 120);
    setWidth(w);
    setHeight(h);

    setIsGenerating(true);
    
    try {
      const imgElement = new Image();
      imgElement.src = image;
      await new Promise((resolve) => {
        imgElement.onload = resolve;
      });

      setTimeout(async () => {
        try {
          const result = await PerlerBeadGenerator.generate(imgElement, w, h, algorithm, palette, brightness);
          setResultImage(result);
        } catch (error) {
          console.error("Generation failed:", error);
          alert("生成图纸失败，请重试。 Generation failed, please try again.");
        } finally {
          setIsGenerating(false);
        }
      }, 50);
      
    } catch (error) {
      console.error("Image loading failed:", error);
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `perler-pattern-${width}x${height}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderBaseTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24">
      {/* Left Panel: Controls */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-[#a3bdb2]/40 p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#a3bdb2]/30 pb-4">
            <Settings2 className="w-5 h-5 text-[#20243F]" />
            <h2 className="text-lg font-medium text-[#20243F]">参数设置 <span className="text-neutral-400 text-sm font-normal ml-1">Parameters</span></h2>
          </div>

          {/* Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">上传原图 <span className="text-neutral-400 font-normal ml-1">Upload Image</span></label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#a3bdb2]/50 border-dashed rounded-xl hover:border-[#20243F] hover:bg-[#a3bdb2]/10 transition-colors cursor-pointer group"
            >
              <div className="space-y-1 text-center">
                {image ? (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden">
                    <img src={image} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-[#a3bdb2] group-hover:text-[#20243F] transition-colors" />
                    <div className="flex text-sm text-neutral-600 justify-center">
                      <span className="relative rounded-md font-medium text-[#20243F] hover:text-[#20243F]/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#20243F]">
                        点击上传图片 Click to upload
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">支持 PNG, JPG 格式</p>
                  </>
                )}
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/jpeg, image/png" 
              className="hidden" 
            />
          </div>

          {/* Dimensions */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">宽度 <span className="text-neutral-400 font-normal ml-1">Width</span> (Max: 120)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="120" 
                  value={width} 
                  onChange={(e) => setWidth(parseInt(e.target.value) || 1)}
                  className="block w-full rounded-lg border-[#a3bdb2]/50 shadow-sm focus:border-[#20243F] focus:ring-[#20243F] sm:text-sm px-3 py-2 border outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-700">高度 <span className="text-neutral-400 font-normal ml-1">Height</span> (Max: 120)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="120" 
                  value={height} 
                  onChange={(e) => setHeight(parseInt(e.target.value) || 1)}
                  className="block w-full rounded-lg border-[#a3bdb2]/50 shadow-sm focus:border-[#20243F] focus:ring-[#20243F] sm:text-sm px-3 py-2 border outline-none"
                />
              </div>
            </div>
            {/* Quick Sizes */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={() => { setWidth(18); setHeight(18); }} className="px-2 py-1 text-xs bg-[#a3bdb2]/20 hover:bg-[#a3bdb2]/40 rounded text-[#20243F] transition-colors border border-[#a3bdb2]/30">18x18 (小挂件 Small)</button>
              <button onClick={() => { setWidth(36); setHeight(36); }} className="px-2 py-1 text-xs bg-[#a3bdb2]/20 hover:bg-[#a3bdb2]/40 rounded text-[#20243F] transition-colors border border-[#a3bdb2]/30">36x36</button>
              <button onClick={() => { setWidth(52); setHeight(52); }} className="px-2 py-1 text-xs bg-[#a3bdb2]/20 hover:bg-[#a3bdb2]/40 rounded text-[#20243F] transition-colors border border-[#a3bdb2]/30">52x52 (标准 Std)</button>
              <button onClick={() => { setWidth(72); setHeight(72); }} className="px-2 py-1 text-xs bg-[#a3bdb2]/20 hover:bg-[#a3bdb2]/40 rounded text-[#20243F] transition-colors border border-[#a3bdb2]/30">72x72</button>
            </div>
          </div>

          {/* Algorithm */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">降采样算法 <span className="text-neutral-400 font-normal ml-1">Downsampling</span></label>
            <select 
              value={algorithm} 
              onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
              className="block w-full rounded-lg border-[#a3bdb2]/50 shadow-sm focus:border-[#20243F] focus:ring-[#20243F] sm:text-sm px-3 py-2 border bg-white outline-none"
            >
              <option value="average">区域平均 (Average) - 推荐</option>
              <option value="gradient_enhanced">梯度增强 (Gradient Enhanced) - 锐利</option>
              <option value="nearest">临近插值 (Nearest) - 像素级</option>
            </select>
          </div>

          {/* Palette */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">色系选择 <span className="text-neutral-400 font-normal ml-1">Palette</span></label>
            <select 
              value={palette} 
              onChange={(e) => setPalette(e.target.value as PaletteKey)}
              className="block w-full rounded-lg border-[#a3bdb2]/50 shadow-sm focus:border-[#20243F] focus:ring-[#20243F] sm:text-sm px-3 py-2 border bg-white outline-none"
            >
              {brandNames.map(brand => (
                <option key={brand} value={brand}>{brand}色卡</option>
              ))}
            </select>
          </div>

          {/* Brightness */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">亮度调节 <span className="text-neutral-400 font-normal ml-1">Brightness</span></label>
            <input 
              type="range" 
              min="-2" 
              max="2" 
              step="1" 
              value={brightness} 
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="w-full accent-[#20243F]"
            />
            <div className="flex justify-between text-xs text-neutral-500">
              <span>-2 (暗 Dark)</span>
              <span>0 (默认 Default)</span>
              <span>+2 (亮 Light)</span>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!image || isGenerating}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white ${
              !image || isGenerating ? 'bg-[#a3bdb2] cursor-not-allowed text-white/70' : 'bg-[#20243F] hover:bg-[#20243F]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#20243F]'
            } transition-colors`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                生成中 Generating...
              </>
            ) : (
              '生成图纸 Generate'
            )}
          </button>
        </div>
      </div>

      {/* Right Panel: Result */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl shadow-sm border border-[#a3bdb2]/40 p-6 h-full min-h-[600px] flex flex-col">
          <div className="flex items-center justify-between border-b border-[#a3bdb2]/30 pb-4 mb-4">
            <h2 className="text-lg font-medium text-[#20243F]">预览结果 <span className="text-neutral-400 text-sm font-normal ml-1">Preview</span></h2>
            {resultImage && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 border border-[#a3bdb2]/50 shadow-sm text-sm font-medium rounded-lg text-[#20243F] bg-white hover:bg-[#a3bdb2]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#20243F] transition-colors"
              >
                <Download className="-ml-1 mr-2 h-4 w-4 text-[#20243F]" />
                下载图纸 Download
              </button>
            )}
          </div>

          <div className="flex-1 bg-white rounded-xl border border-[#a3bdb2]/30 overflow-hidden flex items-center justify-center relative">
            {isGenerating ? (
              <div className="flex flex-col items-center text-[#20243F]">
                <Loader2 className="animate-spin h-10 w-10 mb-4 text-[#20243F]" />
                <p>正在处理图像并匹配色号 Processing...</p>
              </div>
            ) : resultImage ? (
              <div className="w-full h-full overflow-auto p-4 flex items-center justify-center bg-neutral-100/50">
                <img 
                  src={resultImage} 
                  alt="Generated Pattern" 
                  className="max-w-none shadow-md"
                  style={{ maxHeight: '800px' }}
                />
              </div>
            ) : (
              <div className="text-center text-neutral-400">
                <ImageIcon className="mx-auto h-12 w-12 mb-3 opacity-30 text-[#20243F]" />
                <p>上传图片并点击生成，在此预览图纸<br/><span className="text-sm">Upload an image and generate to preview</span></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedTab = () => {
    if (isCheckingAuth) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-[600px]">
          <Loader2 className="w-8 h-8 text-[#a3bdb2] animate-spin" />
        </div>
      );
    }

    if (!isAuth) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-[600px] p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#a3bdb2]/30 w-full max-w-md p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-[#a3bdb2]/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-[#20243F]" />
              </div>
              <h1 className="text-2xl font-bold text-[#20243F]">高级功能解锁</h1>
              <p className="text-neutral-500 text-sm">请输入激活密钥以绑定此设备<br/>Please enter activation key to bind device</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <input 
                  type="text" 
                  value={licenseKey}
                  onChange={e => setLicenseKey(e.target.value)}
                  placeholder="例如: VIP-8888"
                  className="w-full px-4 py-3 rounded-xl border border-[#a3bdb2]/50 focus:border-[#20243F] focus:ring-2 focus:ring-[#20243F] outline-none transition-all text-center font-mono text-lg tracking-wider uppercase"
                />
              </div>
              {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}
              <button 
                onClick={handleActivate}
                disabled={isActivating || !licenseKey}
                className="w-full py-3 rounded-xl bg-[#20243F] text-white font-medium hover:bg-[#20243F]/90 disabled:opacity-50 transition-colors flex justify-center items-center"
              >
                {isActivating ? <Loader2 className="w-5 h-5 animate-spin" /> : '激活设备 Activate'}
              </button>
            </div>
            
            <div className="text-xs text-neutral-400 text-center mt-6">
              <p>设备指纹技术保护 · 一机一码</p>
              <p>Device Fingerprinting Protected</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#a3bdb2]/40 p-8 min-h-[600px] flex flex-col items-center justify-center text-center space-y-4">
        <Sparkles className="w-16 h-16 text-[#a3bdb2]" />
        <h2 className="text-2xl font-bold text-[#20243F]">高级功能已解锁</h2>
        <p className="text-neutral-500 max-w-md">
          您已成功验证设备。高级功能正在开发中，稍后将在此界面提供更多强大的工具。
        </p>
        <button 
          onClick={() => { localStorage.removeItem('perler_license'); setIsAuth(false); }}
          className="mt-8 px-4 py-2 text-sm text-[#20243F] border border-[#a3bdb2]/50 rounded-lg hover:bg-[#a3bdb2]/10 transition-colors"
        >
          退出高级模式
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#20243F]/5 text-neutral-900 font-sans selection:bg-[#a3bdb2]/50 selection:text-[#20243F] flex flex-col">
      {/* Header */}
      <header className="bg-[#20243F] sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#a3bdb2] rounded-lg flex items-center justify-center shadow-sm">
              <ImageIcon className="w-5 h-5 text-[#20243F]" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">豆拼拼-图纸工厂 <span className="text-[#a3bdb2] text-base font-normal ml-2 hidden sm:inline">Perler Pattern Factory</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-[#a3bdb2] font-medium">v2.0.0</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'base' ? renderBaseTab() : renderAdvancedTab()}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#a3bdb2]/30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16 gap-8 sm:gap-16">
            <button
              onClick={() => setActiveTab('base')}
              className={`flex flex-col items-center justify-center w-24 h-full transition-colors ${
                activeTab === 'base' 
                  ? 'text-[#20243F] border-t-2 border-[#20243F]' 
                  : 'text-neutral-400 hover:text-[#20243F]/70 border-t-2 border-transparent'
              }`}
            >
              <LayoutGrid className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">基础 Base</span>
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`flex flex-col items-center justify-center w-24 h-full transition-colors ${
                activeTab === 'advanced' 
                  ? 'text-[#20243F] border-t-2 border-[#20243F]' 
                  : 'text-neutral-400 hover:text-[#20243F]/70 border-t-2 border-transparent'
              }`}
            >
              <Sparkles className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">高级 Advanced</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
