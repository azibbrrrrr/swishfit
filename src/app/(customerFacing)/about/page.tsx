import Image from 'next/image';
import { getAboutImages } from '@/lib/getImages';

export default function AboutPage() {
  const images = getAboutImages();

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold text-center mb-6">About Us</h1>
      <p className="text-center max-w-2xl mx-auto">
        Rusholme Rendunks is more than just a basketball team—it’s a community.
        Founded by a group of Malaysian students in Manchester...
      </p>

      <h2 className="text-3xl font-bold text-center mb-6 pt-6">Who We Are</h2>
      <p className="text-center max-w-2xl mx-auto">
        Our team name combines “Rusholme”, the place we stayed, with “Rendunks”,
        a fusion of “Rendang”, a beloved Malaysian dish, and “Dunk”, a signature
        basketball move. This represents both our Malaysian identity and love
        for the game.
      </p>

      <h2 className="text-3xl font-bold text-center mb-6 pt-6">Our Mission</h2>
      <p className="text-center max-w-2xl mx-auto">
        We started as a way to stay connected through basketball, and it remains
        a symbol of our time together in the UK. We aim to inspire and bring
        people together through sports, culture, and friendship.
      </p>

      <h2 className="text-3xl font-bold text-center mb-6 pt-6">
        Our Merchandise
      </h2>
      <p className="text-center max-w-2xl mx-auto">
        While our warmup and game jerseys are exclusive to our team, the other
        merchandise displayed—such as the game ball, poster, socks, hoodie, and
        cap—are not actual products. These items serve as a way to share our
        story with others.
      </p>

      {/* Masonry Layout */}
      <h2 className="text-3xl font-bold text-center mb-6 pt-6">Memories</h2>
      <p className="text-center max-w-screen-lg mx-auto pb-10">
        Here are some of our best moments on and off the court.
      </p>
      <div className="columns-3 lg:columns-4 gap-1 space-y-1 md:gap-2 md:space-y-2 max-w-screen-lg mx-auto w-full">
        {images.map((src, index) => (
          <div key={index} className="mb-0">
            <Image
              src={src}
              alt={`Gallery Image ${index + 1}`}
              width={400}
              height={500}
              className="w-full h-auto object-cover rounded-md"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
