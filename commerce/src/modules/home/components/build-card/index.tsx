import Image from "next/image";

export default function BuildCard() {
  return (
    <div className="w-full max-w-[628px] rounded-xl border border-[#E6E6E6] bg-white shadow-[0_3px_40px_rgba(0,0,0,0.12)] p-6 flex flex-col gap-8">
      
      {/* Top Section */}
      <div className="flex flex-col gap-6 w-full">
        
        {/* Header Row */}
        <div className="flex items-start gap-4">
          
          {/* Image */}
          <div className="w-[110px] h-[75px] relative shrink-0">
            <Image
              src="/images/food.png" // replace with your asset
              alt="Food"
              fill
              className="object-contain drop-shadow-md"
            />
          </div>

          {/* Title + Subtitle */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-black">
              Build Your Own
            </h2>
            <p className="text-lg text-gray-500">
              Create your bundle, your way.
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-lg leading-relaxed text-[rgb(var(--primary))]">
          Pick exactly what your body needs. Select fresh vegetables and fruits,
          control your calories, and build a bundle tailored to your health goal.
        </p>
      </div>

      {/* CTA */}
      <button className="w-full py-4 rounded-xl bg-[rgb(var(--primary))] text-white text-lg font-medium hover:bg-[rgb(var(--primary-light))] transition-colors">
        Start Building
      </button>
    </div>
  );
}