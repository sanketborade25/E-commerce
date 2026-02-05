import leftData from "./servicesLeftSidebarData";

const baseCenterData = {
  womenSalon: {
    sections: [
      {
        id: "super-saver",
        img: "womenSalon/banner (1).png",
        title: "Super saver packages",
        items: [
          {
            img: "womenSalon/superSaver.png",
            name: "4 session pack",
            desc: "Bundle of 4 services. Best value pack.",
            price: 3996
          }
        ]
      },
      {
        id: "waxing",
        img: "womenSalon/banner (2).png",
        title: "Waxing & threading",
        items: [
          {
            img: "womenSalon/waxAndThread.png",
            name: "Full leg waxing",
            desc: "Full legs waxing with premium wax.",
            price: 799
          }
        ]
      },
      {
        id: "korean-facial",
        img: "womenSalon/banner (3).png",
        title: "Korean facial",
        items: [
          {
            img: "womenSalon/koreanFacial.png",
            name: "Korean facial",
            desc: "Deep hydration for a glass-skin glow.",
            price: 1299
          }
        ]
      },
      {
        id: "signature-facials",
        img: "womenSalon/banner (4).png",
        title: "Signature facials",
        items: [
          {
            img: "womenSalon/signature.png",
            name: "Signature facial",
            desc: "Custom facial based on your skin type.",
            price: 1299
          }
        ]
      },
      {
        id: "ayurvedic-facial",
        img: "womenSalon/banner (5).png",
        title: "Ayurvedic facial",
        items: [
          {
            img: "womenSalon/ayurvedic.png",
            name: "Ayurvedic facial",
            desc: "Herbal care to soothe and brighten skin.",
            price: 1299
          }
        ]
      },
      {
        id: "cleanup",
        img: "womenSalon/banner (6).png",
        title: "Clean-up facial",
        items: [
          {
            img: "womenSalon/cleanup.png",
            name: "Clean-up facial",
            desc: "Quick clean-up to refresh and detox.",
            price: 1299
          }
        ]
      },
      {
        id: "pedicure",
        img: "womenSalon/banner (7).png",
        title: "Pedicure",
        items: [
          {
            img: "womenSalon/pedicure.png",
            name: "Pedicure",
            desc: "Foot soak, scrub, and nail care.",
            price: 1299
          }
        ]
      },
      {
        id: "stress-relief",
        img: "womenSalon/banner (8).png",
        title: "Stress relief",
        items: [
          {
            img: "womenSalon/image (10).png",
            name: "Abhyangam massage",
            desc: "Full body oil massage for relaxation.",
            price: 1299
          }
        ]
      },
      {
        id: "hair-bleach",
        img: "womenSalon/banner (9).png",
        title: "Hair, bleach & detan",
        items: [
          {
            img: "womenSalon/hairBleachDetan.png",
            name: "Hair treatment",
            desc: "Nourishing treatment for smooth hair.",
            price: 1299
          }
        ]
      }
    ]
  },
  spaForWomen: {
    sections: [
      {
        id: "super-saver",
        img: "womenSalon/banner (10).png",
        title: "Super saver packs",
        items: [
          {
            img: "womenSalon/image (1).png",
            name: "4 session pack",
            desc: "Bundle of spa sessions at a better price.",
            price: 3996
          }
        ]
      },
      {
        id: "stress-relief",
        img: "womenSalon/banner (11).png",
        title: "Stress relief",
        items: [
          {
            img: "womenSalon/image (2).png",
            name: "Abhyangam massage",
            desc: "Full body oil massage for deep relaxation.",
            price: 1299
          }
        ]
      },
      {
        id: "pain-relief",
        img: "womenSalon/banner (12).png",
        title: "Pain relief",
        items: [
          {
            img: "womenSalon/image (3).png",
            name: "Deep tissue massage",
            desc: "Targets soreness and muscle tightness.",
            price: 1499
          }
        ]
      },
      {
        id: "ayurvedic",
        img: "womenSalon/banner (9).png",
        title: "Ayurvedic skin care",
        items: [
          {
            img: "womenSalon/image (4).png",
            name: "Ayurvedic glow therapy",
            desc: "Herbal therapy for calm, nourished skin.",
            price: 1399
          }
        ]
      },
      {
        id: "addons",
        img: "womenSalon/banner (8).png",
        title: "Add-ons",
        items: [
          {
            img: "womenSalon/image (5).png",
            name: "Foot reflexology",
            desc: "Add-on for extra relaxation.",
            price: 399
          }
        ]
      }
    ]
  },
  hairStudioForWomen: {
    sections: [
      {
        id: "packages",
        img: "hair_stido_for_women/image_1.png",
        title: "Packages",
        items: [
          {
            img: "hair_stido_for_women/image_10.png",
            name: "Care combo",
            desc: "Wash, cut, and blow-dry package.",
            price: 1299
          }
        ]
      },
      {
        id: "blow-dry",
        img: "hair_stido_for_women/image_2.png",
        title: "Blow-dry & style",
        items: [
          {
            img: "hair_stido_for_women/image_11.png",
            name: "Signature blow-dry",
            desc: "Smooth finish with lasting hold.",
            price: 699
          }
        ]
      },
      {
        id: "cut-trim",
        img: "hair_stido_for_women/image_4.png",
        title: "Cut & trim",
        items: [
          {
            img: "hair_stido_for_women/image_12.png",
            name: "Haircut & styling",
            desc: "Precision cut with styling.",
            price: 648
          }
        ]
      },
      {
        id: "hair-care",
        img: "hair_stido_for_women/image_5.png",
        title: "Hair care",
        items: [
          {
            img: "hair_stido_for_women/image_13.png",
            name: "Nourish treatment",
            desc: "Deep conditioning for soft, shiny hair.",
            price: 999
          }
        ]
      },
      {
        id: "keratin-botox",
        img: "hair_stido_for_women/image_6.png",
        title: "Keratin & botox",
        items: [
          {
            img: "hair_stido_for_women/image_14.png",
            name: "Keratin smoothening",
            desc: "Long-lasting smooth, frizz-free hair.",
            price: 2499
          }
        ]
      },
      {
        id: "hair-colour",
        img: "hair_stido_for_women/image_7.png",
        title: "Hair colour",
        items: [
          {
            img: "hair_stido_for_women/image_16.png",
            name: "Root touch-up",
            desc: "Quick color refresh for roots.",
            price: 899
          }
        ]
      },
      {
        id: "hair-extensions",
        img: "hair_stido_for_women/image_8.png",
        title: "Hair extensions",
        items: [
          {
            img: "hair_stido_for_women/image_17.png",
            name: "Clip-in extensions",
            desc: "Instant length and volume.",
            price: 1599
          }
        ]
      },
      {
        id: "fashion-color",
        img: "hair_stido_for_women/image_9.png",
        title: "Fashion color",
        items: [
          {
            img: "hair_stido_for_women/image_18.png",
            name: "Fashion streaks",
            desc: "Bold color streaks for a new look.",
            price: 1199
          }
        ]
      }
    ]
  },
  makeupStyling: {
    sections: [
      {
        id: "packages",
        img: "makeupAndStylingStudio/image_10.png",
        title: "Packages",
        items: [
          {
            img: "makeupAndStylingStudio/image_12.png",
            name: "Makeup package",
            desc: "Complete look for parties and events.",
            price: 1999
          }
        ]
      },
      {
        id: "group-deals",
        img: "makeupAndStylingStudio/image_13.png",
        title: "Group deals",
        items: [
          {
            img: "makeupAndStylingStudio/image_15.png",
            name: "Bridal group deal",
            desc: "Group discounts for weddings.",
            price: 4999
          }
        ]
      },
      {
        id: "combos",
        img: "makeupAndStylingStudio/image_16.png",
        title: "Combos",
        items: [
          {
            img: "makeupAndStylingStudio/image_18.png",
            name: "Makeup + hair",
            desc: "Makeup and styling together.",
            price: 2499
          }
        ]
      },
      {
        id: "professional-makeup",
        img: "makeupAndStylingStudio/image_19.png",
        title: "Professional makeup",
        items: [
          {
            img: "makeupAndStylingStudio/image_20.png",
            name: "HD makeup",
            desc: "Flawless HD finish for photos.",
            price: 2999
          }
        ]
      },
      {
        id: "styling",
        img: "makeupAndStylingStudio/image_22.png",
        title: "Styling",
        items: [
          {
            img: "makeupAndStylingStudio/image_24.png",
            name: "Hair styling",
            desc: "Elegant curls or sleek straight.",
            price: 899
          }
        ]
      },
      {
        id: "addons",
        img: "makeupAndStylingStudio/image_25.png",
        title: "Add-ons",
        items: [
          {
            img: "makeupAndStylingStudio/image_26.png",
            name: "Lashes add-on",
            desc: "Volumizing lashes for extra pop.",
            price: 299
          }
        ]
      }
    ]
  }
};

const priceList = [399, 499, 599, 699, 799, 899, 999, 1099, 1299, 1499, 1999, 2499];

const bannerByServiceKey = {
  massageForMen: "massageForMen/image_15.png",
  carpenter: "carpenter/image_22.png",
  kitchenCleaning: "kitchenCleaning/image_9.png",
  livingBedroomCleaning: "LivingRoomCleaning/image_20.png",
  woodPolish: "woodPolish/image_30.png",
  wallsRoomsPainting: "WallAndRoomPainting/image_1.png",
  acService: "ACrepair/image_2.png",
  electrician: "electrician/image_22.png"
};

const buildLongDesc = (label, existing) => {
  const base = existing || `Includes ${label.toLowerCase()} service.`;
  return (
    `${base} ` +
    "Detailed inspection and preparation included. " +
    "Standard tools and materials used where applicable. " +
    "Clean finish with after-service guidance."
  );
};

const variantNames = ["Basic", "Standard", "Premium", "Advanced", "Plus"];

const buildItemSet = (label, img, basePrice, existingItems = []) => {
  const normalizedExisting = existingItems.map((it, idx) => ({
    ...it,
    img: it.img || img,
    name: it.name || `${label} - ${variantNames[idx % variantNames.length]}`,
    desc: buildLongDesc(it.name || label, it.desc),
    price: it.price ?? basePrice + idx * 150
  }));

  if (normalizedExisting.length >= 3) {
    return normalizedExisting;
  }

  const needed = 3 - normalizedExisting.length;
  const startIdx = normalizedExisting.length;
  const generated = Array.from({ length: needed }, (_, i) => {
    const idx = startIdx + i;
    const name = `${label} - ${variantNames[idx % variantNames.length]}`;
    return {
      img,
      name,
      desc: buildLongDesc(name),
      price: basePrice + idx * 150
    };
  });

  return [...normalizedExisting, ...generated];
};

const normalizeSections = (menu = [], sections = [], serviceKey = "") => {
  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  return menu.map((item, idx) => {
    const existing = sectionMap.get(item.id);
    const banner = bannerByServiceKey[serviceKey];
    const baseImg = existing?.img || item.img;
    const shouldUseBanner =
      !!banner &&
      (!baseImg ||
        baseImg === item.img ||
        baseImg.includes("1Homepage/ServiceCategory") ||
        baseImg.includes("1Homepage/serviceCategory"));

    const basePrice = priceList[idx % priceList.length];
    const items = buildItemSet(
      item.label,
      item.img,
      basePrice,
      existing?.items || []
    );

    return {
      id: item.id,
      img: shouldUseBanner ? banner : baseImg,
      title: existing?.title || item.label,
      items
    };
  });
};

export const servicesCenterData = Object.fromEntries(
  Object.entries(leftData).map(([key, value]) => [
    key,
    {
      sections: normalizeSections(value.menu || [], baseCenterData[key]?.sections || [], key)
    }
  ])
);

export default servicesCenterData;
