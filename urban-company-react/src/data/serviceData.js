const serviceData = {
  women: {
    title: "Women's Salon & Spa",
    sections: [
      {
        items: [
          { name: "Salon for Women", img: "/images/1Homepage/ServiceCategory/SalonForWomen.png", link: "/services/womenSalon" },
          { name: "Spa for Women", img: "/images/1Homepage/ServiceOptions/women-spa.png", link: "/services/spaForWomen"},
          { name: "Hair Studio for Women", img: "/images/1Homepage/ServiceOptions/hair.png", link: "/services/hairStudioForWomen" },
          { name: "Makeup & Styling Studio", img: "/images/1Homepage/ServiceOptions/makeup.png", link: "/services/hairStudioForWomen" }
        ]
      }
    ]
  },

  men: {
    title: "Men's Salon & Massage",
    sections: [
      {
        items: [
          { name: "Salon for Men", img: "/images/1Homepage/ServiceCategory/MenSalon.png", instant: true , link: "/services/salonForMen"},
          { name: "Massage for Men", img: "/images/1Homepage/ServiceOptions/massage-men.png", link: "/services/massageForMen" }
        ]
      }
    ]
  },

  cleaning: {
    title: "Cleaning & Pest Control",
    sections: [
      {
        heading: "Cleaning",
        items: [
          { name: "Bathroom Cleaning", img: "/images/1Homepage/ServiceOptions/bathroom.png", link: "/services/bathroomCleaning" },
          { name: "Kitchen Cleaning", img: "/images/1Homepage/ServiceOptions/kitchen.png", link: "/services/kitchenCleaning" },
          { name: "Living & Bedroom Cleaning", img: "/images/1Homepage/ServiceOptions/living.png", tag: "NEW" , link: "/services/livingBedroomCleaning"},
          { name: "Full Home / Move-in", img: "/images/1Homepage/ServiceOptions/fullhome.png" , link: "/services/fullHomeCleaning"}
        ]
      },
      {
        heading: "Pest Control",
        items: [
          { name: "Cockroach Control", img: "/images/1Homepage/ServiceOptions/cockroach.png" , link: "/services/cockroachControl"},
          { name: "Termite Control", img: "/images/1Homepage/ServiceOptions/termite.png" , link: "/services/termiteControl"},
          { name: "Bed Bugs Control", img: "/images/1Homepage/ServiceOptions/bedbug.png" , link: "/services/bedBugsControl"},
          { name: "Ant Control", img: "/images/1Homepage/ServiceOptions/termite.png", tag: "NEW" , link: "/services/antControl"}
        ]
      }
    ]
  },

  epc: {
    title: "Electrician, Plumber & Carpenter",
    sections: [
      {
        heading: "Repairs",
        items: [
          { name: "Electrician", img: "/images/1Homepage/ServiceOptions/Electrician.png", link: "/services/electrician" },
          { name: "Carpenter", img: "/images/1Homepage/ServiceOptions/carpenter.png", tag: "NEW", link: "/services/carpenter" }
        ]
      },
      
      {
        heading: "Installations & other services",
        items: [
          { name: "Tile Grouting", img: "/images/1Homepage/ServiceOptions/tile.png", link: "/services/tileGrouting" },
          { name: "Wood Polish", img: "/images/1Homepage/ServiceOptions/wood-polish.png", link: "/services/woodPolish" }
        ]
      }
    ]
  },
  ac: {
    title: "AC & Appliance Repair",
    sections: [
      {
        heading: "Home appliances",
        items: [
          { name: "AC", img: "/images/1Homepage/ServiceOptions/ac.png", instant: true, link: "/services/acService" },
          { name: "Washing Machine", img: "/images/1Homepage/ServiceOptions/wm.png", instant: true, link: "/services/washingMachineRepair" },
          { name: "Television", img: "/images/1Homepage/ServiceOptions/tv.png", instant: true, link: "/services/televisionRepair" },
          { name: "Laptop", img: "/images/1Homepage/ServiceOptions/laptop.png", link: "/services/laptopRepair" },
          { name: "Water Purifier Repair", img: "/images/1Homepage/ServiceCategory/Purifier.png", link: "/services/waterPurifierRepair" }
        ]
      },
      {
        heading: "Kitchen appliances",
        items: [
          { name: "Refrigerator", img: "/images/1Homepage/ServiceOptions/refrigerator.png", instant: true, link: "/services/refrigeratorRepair" },
          { name: "Microwave", img: "/images/1Homepage/ServiceOptions/microwave.png", instant: true, link: "/services/microwaveRepair" },
          { name: "Chimney", img: "/images/1Homepage/ServiceOptions/kitchen.png", link: "/services/chimneyRepair" }
        ]
      },
    ]
  },
  painting: {
    title: "Painting & Waterproofing",
    sections: [
      {
        items: [
          { name: "Full home painting", img: "/images/1Homepage/ServiceOptions/fullhome.png", tag: "NEW" , link: "/services/fullHomePainting" },
          { name: "Walls & Rooms Painting", img: "/images/1Homepage/ServiceOptions/fullhome.png", link: "/services/wallsRoomsPainting" }
        ]
      },
      {
        heading: "Wall makeover",
        items: [
          { name: "Wall makeover by Revamp", img: "/images/1Homepage/ServiceOptions/revamp.png", link: "/services/wallMakeover" }
        ]
      }
    ]
  },
};

export default serviceData;
