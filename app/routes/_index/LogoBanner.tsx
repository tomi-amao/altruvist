import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";

const CompanyLogoBanner = () => {
  const [width, setWidth] = useState(0);
  const containerRef = React.useRef(null);

  useEffect(() => {
    // Recalculate width on window resize
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(
          containerRef.current.scrollWidth - containerRef.current.offsetWidth,
        );
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Example company data - replace with your actual companies
  const companies = [
    {
      name: "Global Hope Initiative",
      logo: "/images/charities/global-hope.svg",
      class: "bg-accentPrimary",
    },
    {
      name: "EarthCare Foundation",
      logo: "/images/charities/earthcare.svg",
      class: "bg-basePrimary",
    },
    {
      name: "Kids First Alliance",
      logo: "/images/charities/kids-first.svg",
      class: "bg-basePrimaryLight",
    },
    {
      name: "Animal Sanctuary Network",
      logo: "/images/charities/animal-sanctuary.svg",
      class: "bg-basePrimaryDark",
    },
    {
      name: "Clean Water Project",
      logo: "/images/charities/clean-water.svg",
      class: "bg-basePrimary",
    },
    {
      name: "Food For All",
      logo: "/images/charities/food-for-all.svg",
      class: "bg-basePrimary",
    },
    {
      name: "Education Forward",
      logo: "/images/charities/education.svg",
      class: "bg-basePrimary",
    },
    {
      name: "Medical Aid Worldwide",
      logo: "/images/charities/medical-aid.svg",
      class: "bg-accentPrimary",
    },
  ];

  return (
    <section className="py-12 rounded-lg" aria-labelledby="partners-heading">
      <div className="max-w-7xl mx-auto px-4">
        <h2
          id="partners-heading"
          className="text-center text-2xl font-semibold mb-8 text-accentPrimary"
        >
          Trusted by Charities
        </h2>

        <div className="overflow-hidden">
          <motion.div
            ref={containerRef}
            className="flex cursor-grab"
            drag="x"
            dragConstraints={{ right: 0, left: -width }}
            whileTap={{ cursor: "grabbing" }}
          >
            <motion.div
              className="flex items-center gap-12 px-8"
              animate={{ x: [-width, 0] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 20,
                  ease: "linear",
                },
              }}
            >
              {companies.map((company, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center justify-center h-24 px-8 rounded-lg ${company.class} shadow-sm hover:shadow-md transition-shadow duration-300`}
                >
                  {/* <img
                    src={company.logo}
                    alt={`${company.name} logo`}
                    className="h-8 object-contain"
                    loading="lazy"
                  /> */}
                  <p className="mt-2 text-sm font-medium ">{company.name}</p>
                </div>
              ))}

              {/* Duplicate companies for seamless looping */}
              {companies.map((company, index) => (
                <div
                  key={`dup-${index}`}
                  className={`flex flex-col items-center justify-center h-24 px-8 rounded-lg ${company.class} shadow-sm hover:shadow-md transition-shadow duration-300`}
                >
                  {/* <img
                    src={company.logo}
                    alt={`${company.name} logo`}
                    className="h-8 object-contain"
                    loading="lazy"
                  /> */}
                  <p className="mt-2 text-sm font-medium ">{company.name}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CompanyLogoBanner;
