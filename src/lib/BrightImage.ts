import NextImage from 'next/image';
import { useState, useEffect } from 'react';

export default function BrightImage({ src }: { src: string }) {
  const [brightness, setBrightness] = useState<number>(1);

  useEffect(() => {
    const adjustBrightness = async () => {
      const brightnessLevel = await getBrightnessLevel(src);
      setBrightness(brightnessLevel);
    };

    adjustBrightness();
  }, [src]);

  const getBrightnessLevel = (src: string): Promise<number> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.crossOrigin = 'Anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return resolve(1);

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
        let totalBrightness = 0;

        for (let i = 0; i < imageData.length; i += 4) {
          const avg = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
          totalBrightness += avg;
        }

        const avgBrightness = totalBrightness / (imageData.length / 4);
        resolve(avgBrightness < 100 ? 1.4 : 1); // Brighten only dark images
      };

      img.onerror = () => resolve(1);
    });
  };

  return (
    <NextImage
      src={src}
      alt="Brightened Image"
      width={400}
      height={500}
      className="w-full h-auto object-cover rounded-md"
      style={{ filter: `brightness(${brightness})` }}
    />
  );
}
