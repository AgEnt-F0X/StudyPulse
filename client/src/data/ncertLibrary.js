// NCERT library seed — CBSE-accurate chapter pages used by the reader,
// the grounded tutor and the notes generator. Pages are plain text blocks
// (figure blocks marked with type:'figure') so the Select-Area crop,
// highlights and Gemini grounding all work over the same content.
// Custom uploaded PDFs (Library.jsx) extend this at runtime.

export const NCERT_LIBRARY = [
  {
    id: 'sci10-light',
    classLevel: 'Class 10',
    subject: 'Science',
    number: 10,
    title: 'Light: Reflection and Refraction',
    summary: 'Laws of reflection, spherical mirrors and image formation, refraction, refractive index, lenses, lens formula and power of a lens.',
    concepts: [
      'Laws of reflection',
      'Image formation by spherical mirrors',
      'Mirror formula and magnification',
      'Refraction and refractive index',
      'Lens formula and power of a lens',
    ],
    pages: [
      {
        pageNumber: 1,
        heading: '10.1 Reflection of Light',
        blocks: [
          { type: 'text', text: 'Light seems to travel in straight lines. The rectilinear propagation of light explains the formation of shadows and eclipses. When light falling on a surface bounces back into the same medium, the phenomenon is called reflection. A polished surface, such as a plane mirror, reflects almost all the light falling on it.' },
          { type: 'text', text: 'The law of reflection has two parts. First, the angle of incidence is equal to the angle of reflection. Second, the incident ray, the reflected ray and the normal to the reflecting surface at the point of incidence all lie in the same plane. Both angles are always measured from the normal — the perpendicular to the mirror at the point where the ray strikes it. Measuring from the mirror surface itself is the single most common error in board examinations.' },
          { type: 'figure', caption: 'Fig. 10.1 — The incident ray, reflected ray and the normal at the point of incidence', description: 'A plane mirror MM′ stands vertical. An incident ray strikes point O on the mirror; the normal ON is perpendicular to the mirror at O. The incident ray and reflected ray make equal angles θ with ON, on opposite sides of it.' },
          { type: 'text', text: 'Reflection from a smooth surface is specular (regular), while rough surfaces scatter light in all directions (diffuse reflection). Diffuse reflection is why we can read this page from any angle — each irregular point reflects light differently, yet locally obeys the same two laws.' },
        ],
      },
      {
        pageNumber: 2,
        heading: '10.2 Spherical Mirrors',
        blocks: [
          { type: 'text', text: 'A spherical mirror is a part of a hollow sphere with one side polished. The centre of the sphere is the centre of curvature (C); the midpoint of the mirror is its pole (P). The line joining C and P is the principal axis, and the point on the axis where parallel rays converge or appear to diverge from is the principal focus (F). For a concave mirror F lies in front; for a convex mirror it lies behind. The distance PF is the focal length f, and R = 2f.' },
          { type: 'text', text: 'Image formation follows the rules of ray tracing: a ray parallel to the axis passes through F after reflection; a ray through C returns along itself; a ray through F emerges parallel to the axis; a ray striking the pole reflects symmetrically about the axis. Concave mirrors form real, inverted images when the object is beyond F, and virtual, erect, magnified images when the object lies between P and F. Convex mirrors always form virtual, erect and diminished images — the reason they are used as rear-view mirrors, giving a wide field of view.' },
          { type: 'figure', caption: 'Fig. 10.2 — Image formation by a concave mirror for an object beyond C', description: 'Object AB stands beyond C on the principal axis. Ray AD parallel to the axis reflects through F; ray AE through C retraces its path. The rays intersect between C and F, forming a real, inverted, diminished image A′B′.' },
          { type: 'text', text: 'The mirror formula relates all three distances: 1/v + 1/u = 1/f, where u is the object distance and v the image distance, both measured from the pole using the Cartesian sign convention (directions taken from P, along the incident light as positive). Magnification m = −v/u = h′/h. A negative m signals an inverted (real) image; a positive m an erect (virtual) one.' },
        ],
      },
      {
        pageNumber: 3,
        heading: '10.3 Refraction and the Lens Formula',
        blocks: [
          { type: 'text', text: 'Light bends when it passes obliquely from one transparent medium to another because its speed changes — this is refraction. The ratio of the speed of light in vacuum to that in the medium is the absolute refractive index n. By Snell\'s law, n₁ sin i = n₂ sin r. A higher refractive index means an optically denser medium; light bends towards the normal entering a denser medium and away entering a rarer one.' },
          { type: 'text', text: 'A lens bends light by refraction at two spherical surfaces. A convex (converging) lens brings parallel rays to a real focus; a concave lens spreads them so they appear to diverge from a virtual focus. The lens formula, 1/v − 1/u = 1/f, uses the same sign convention as mirrors. Magnification m = v/u. The power of a lens P = 1/f measured in dioptres (D) with f in metres; a converging lens has positive power, a diverging lens negative. A combination of thin lenses in contact has power P = P₁ + P₂ + ….' },
          { type: 'figure', caption: 'Fig. 10.3 — Ray diagram for an object placed beyond 2F₁ of a convex lens', description: 'Ray from A parallel to the axis refracts through F₂; ray through the optical centre O passes undeviated. They meet between F₂ and 2F₂, giving a real, inverted, diminished image.' },
        ],
      },
    ],
  },
  {
    id: 'sci10-electricity',
    classLevel: 'Class 10',
    subject: 'Science',
    number: 11,
    title: 'Electricity',
    summary: 'Electric current and circuit, potential difference, Ohm\'s law, resistance and resistivity, series and parallel resistors, heating effect and electric power.',
    concepts: [
      'Electric current and circuit diagrams',
      'Ohm\'s law and V-I relationship',
      'Resistance, resistivity and factors affecting them',
      'Series vs parallel combinations',
      'Heating effect of current and electric power',
    ],
    pages: [
      {
        pageNumber: 1,
        heading: '11.1 Current, Potential Difference and Ohm\'s Law',
        blocks: [
          { type: 'text', text: 'Electric current is the rate of flow of charge: I = Q/t, measured in ampere (A) — 1 A is one coulomb per second. In a metal wire, charge is carried by electrons drifting slowly opposite to the conventional current direction. Charge flows only when there is a potential difference across the ends of the conductor: V = W/Q, measured in volt (V) — one joule of work per coulomb. A battery or cell maintains this difference; an ammeter (connected in series) measures current while a voltmeter (in parallel) measures potential difference.' },
          { type: 'text', text: 'Georg Ohm established experimentally that the current through a metallic conductor is proportional to the potential difference across it, provided physical conditions such as temperature remain constant: V ∝ I, or V = IR. The constant R is the resistance of the conductor, measured in ohm (Ω). The V–I graph of an ohmic conductor is a straight line through the origin with slope 1/R. Filament lamps deviate from straightness because their temperature — and hence resistance — rises as they heat up.' },
          { type: 'figure', caption: 'Fig. 11.1 — V–I graph of an ohmic conductor', description: 'A straight line through the origin in the V–I plane; the slope of the line equals the conductance, and its reciprocal is the resistance R.' },
        ],
      },
      {
        pageNumber: 2,
        heading: '11.2 Resistance, Combinations and Power',
        blocks: [
          { type: 'text', text: 'Resistance depends on four factors: length (R ∝ l), area of cross-section (R ∝ 1/A), the material\'s resistivity ρ, and temperature. The defining relation is R = ρl/A, with ρ in Ω m. Metals have very low resistivity; alloys like nichrome are chosen for heating elements because they resist oxidation at high temperature, while insulators have resistivities many orders of magnitude higher.' },
          { type: 'text', text: 'Resistors in series carry the same current: R = R₁ + R₂ + R₃, and the total p.d. divides in proportion to resistance. In parallel, every resistor has the same p.d.: 1/R = 1/R₁ + 1/R₂ + 1/R₃, and the current divides inversely with resistance. Parallel domestic wiring gives every appliance the full supply voltage and independence from the others.' },
          { type: 'text', text: 'Moving charges do work against resistance and dissipate energy as heat — the Joule heating effect. Heat produced H = I²Rt, and electrical power P = VI = I²R = V²/R, in watt (W). Commercial energy is billed in kilowatt-hour: 1 kWh = 3.6 × 10⁶ J. This is why heater elements use high-resistivity alloys while connecting wires use low-resistivity copper.' },
          { type: 'figure', caption: 'Fig. 11.2 — Three resistors (a) in series and (b) in parallel', description: 'Series: R₁, R₂, R₃ end to end with one current path; ammeter in series. Parallel: all three across the same two nodes; ammeter readings differ per branch.' },
        ],
      },
    ],
  },
  {
    id: 'sci10-carbon',
    classLevel: 'Class 10',
    subject: 'Science',
    number: 4,
    title: 'Carbon and its Compounds',
    summary: 'Covalent bonding, allotropes of carbon, functional groups, homologous series, nomenclature, ethanol and ethanoic acid, soaps and detergents.',
    concepts: [
      'Covalent bonding in carbon compounds',
      'Functional groups and homologous series',
      'Nomenclature of carbon compounds',
      'Ethanol and ethanoic acid reactions',
      'Soaps and detergents: micelle formation',
    ],
    pages: [
      {
        pageNumber: 1,
        heading: '4.1 The Bonding Power of Carbon',
        blocks: [
          { type: 'text', text: 'Carbon has four electrons in its outermost shell. Instead of losing or gaining four electrons — both energetically expensive — carbon completes its octet by sharing, forming covalent bonds. One shared pair is a single bond (H₂, CH₄), two pairs a double bond (O₂, CO₂), three pairs a triple bond (N₂). This tetravalency plus catenation — the ability of carbon atoms to link in chains and rings of enormous variety — is why a whole branch of chemistry exists for carbon compounds.' },
          { type: 'text', text: 'Carbon exists as two important allotropes. In diamond each atom is bonded to four others in a rigid three-dimensional network, making it the hardest natural substance and a thermal conductor but an electrical insulator. In graphite each atom bonds to three others in hexagonal layers; the fourth electron is delocalised, so graphite conducts electricity and the layers slide, making it a good lubricant and pencil "lead".' },
          { type: 'figure', caption: 'Fig. 4.1 — Structures of diamond and graphite', description: 'Diamond: tetrahedral 3-D network with every carbon bonded to four neighbours. Graphite: flat hexagonal sheets with delocalised electrons between layers.' },
        ],
      },
      {
        pageNumber: 2,
        heading: '4.2 Functional Groups, Families and Reactions',
        blocks: [
          { type: 'text', text: 'Compounds of carbon with the same functional group form a homologous series, differing by a fixed −CH₂ unit. Key groups: alcohol (−OH), aldehyde (−CHO), ketone (−CO−), carboxylic acid (−COOH), alkene (C=C) and alkyne (C≡C). IUPAC names build from the chain length (meth-, eth-, prop-, but-) plus the group suffix (-ol, -al, -one, -oic acid).' },
          { type: 'text', text: 'Ethanol (C₂H₅OH) burns cleanly to CO₂ and water, and reacts with sodium to give sodium ethoxide and hydrogen. Heating ethanol with concentrated sulphuric acid at about 443 K removes water, giving ethene — a dehydration reaction. Ethanoic acid (CH₃COOH) is a weak acid (pH ~4, like vinegar); with sodium bicarbonate it releases CO₂ briskly. Reaction of an acid with an alcohol in the presence of concentrated H₂SO₄ produces a sweet-smelling ester — esterification — while ester + NaOH gives back the alcohol and the sodium salt of the acid (saponification).' },
          { type: 'text', text: 'Soaps are sodium salts of long-chain fatty acids. The molecule has two ends: a hydrophilic carboxylate head and a hydrophobic hydrocarbon tail. In water the tails bury into oily dirt forming micelles, and the heads keep the cluster suspended so rinsing carries the oil away. Soaps fail in hard water, where calcium and magnesium salts precipitate as scum — detergents with sulphonate heads avoid this.' },
          { type: 'figure', caption: 'Fig. 4.2 — Micelle formation in water', description: 'Oil droplet surrounded by soap molecules: hydrophobic tails embedded in the oil, hydrophilic heads facing outward into the water.' },
        ],
      },
    ],
  },
  {
    id: 'math10-trigo',
    classLevel: 'Class 10',
    subject: 'Mathematics',
    number: 8,
    title: 'Introduction to Trigonometry',
    summary: 'Trigonometric ratios of acute angles, ratios of 0°, 30°, 45°, 60° and 90°, identities and complementary angle relationships.',
    concepts: [
      'Trigonometric ratios (sin, cos, tan and reciprocals)',
      'Ratios of 0°, 30°, 45°, 60° and 90°',
      'Trigonometric identities',
      'Complementary angle relationships',
    ],
    pages: [
      {
        pageNumber: 1,
        heading: '8.1 Trigonometric Ratios',
        blocks: [
          { type: 'text', text: 'In a right triangle, the ratios of pairs of sides with respect to an acute angle A are named: sine A = opposite/hypotenuse, cosine A = adjacent/hypotenuse, tangent A = opposite/adjacent. Their reciprocals are cosecant, secant and cotangent: cosec A = 1/sin A, sec A = 1/cos A, cot A = 1/tan A = adjacent/opposite. The ratios depend only on the angle, never on the size of the triangle — similar triangles guarantee this.' },
          { type: 'text', text: 'The reciprocal identity structure matters in proofs: writing tan A = sin A/cos A lets every ratio be expressed through sine and cosine alone. Board questions frequently ask to evaluate an expression such as (sin A + cos A)(sin A − cos A) using sin²A + cos²A = 1, which reduces it to sin²A − cos²A.' },
          { type: 'figure', caption: 'Fig. 8.1 — Right triangle ABC with the sides named for angle A', description: 'Right angle at B. For acute angle A at vertex A: side BC is the opposite, AC the hypotenuse, AB the adjacent.' },
        ],
      },
      {
        pageNumber: 2,
        heading: '8.2 Standard Angles and Identities',
        blocks: [
          { type: 'text', text: 'From the 45-45-90 and 30-60-90 triangles: sin 0° = 0, sin 30° = 1/2, sin 45° = 1/√2, sin 60° = √3/2, sin 90° = 1; cosine takes the same values in reverse order; tan 45° = 1 and tan 90° is not defined (cos 90° = 0). A frequent exam trap is swapping sin 30° and cos 30° — remember sine grows from 0 to 1 while cosine falls from 1 to 0 across 0° to 90°.' },
          { type: 'text', text: 'Two identities carry most of the proofs: sin²A + cos²A = 1, and its divided forms 1 + tan²A = sec²A and 1 + cot²A = cosec²A. Complementary angles give the other half of the topic: sin(90° − A) = cos A, tan(90° − A) = cot A, sec(90° − A) = cosec A. Questions worth 3 marks typically require converting every ratio to sines and cosines, then simplifying with the fundamental identity.' },
          { type: 'figure', caption: 'Fig. 8.2 — Values of the standard ratios', description: 'Table: angle 0°, 30°, 45°, 60°, 90° against sin, cos, tan with their exact values.' },
        ],
      },
    ],
  },
  {
    id: 'math10-quadratic',
    classLevel: 'Class 10',
    subject: 'Mathematics',
    number: 4,
    title: 'Quadratic Equations',
    summary: 'Standard form, solution by factorisation and by quadratic formula, nature of roots via discriminant.',
    concepts: [
      'Standard form of a quadratic equation',
      'Solution by factorisation',
      'Quadratic formula and discriminant',
      'Nature of roots (real, equal, complex)',
    ],
    pages: [
      {
        pageNumber: 1,
        heading: '4.1 Standard Form and Factorisation',
        blocks: [
          { type: 'text', text: 'A quadratic equation in x is any equation that can be written as ax² + bx + c = 0 with a ≠ 0 — this is its standard form. The degree of the polynomial is two, so it can have at most two roots. Board questions first ask you to REWRITE a word problem or an equation like x(x + 4) = 12 into standard form before solving: x² + 4x − 12 = 0.' },
          { type: 'text', text: 'Factorisation splits the middle term: find two numbers p and q with p + q = b/a (after normalising) and pq = c/a, then write the product of linear factors. For x² + 4x − 12: split 4x into 6x − 2x, giving (x + 6)(x − 2) = 0, so x = −6 or x = 2. A root makes the equation a true statement — always substitute back to verify.' },
          { type: 'figure', caption: 'Fig. 4.1 — Roots of x² + 4x − 12 as the zeros of the parabola', description: 'Parabola y = x² + 4x − 12 crossing the x-axis at x = −6 and x = 2 — the two roots.' },
        ],
      },
      {
        pageNumber: 2,
        heading: '4.2 The Quadratic Formula and the Discriminant',
        blocks: [
          { type: 'text', text: 'Completing the square on the standard form yields the quadratic formula: x = (−b ± √(b² − 4ac)) / 2a. It works even when factorisation is hard. The quantity D = b² − 4ac is the discriminant, and it decides the nature of the roots without solving: D > 0 gives two distinct real roots, D = 0 gives two equal real roots (x = −b/2a), and D < 0 gives no real roots.' },
          { type: 'text', text: 'Board trap: compute D fully before deciding, and state the nature explicitly — examiners award a mark just for the correct nature statement. For 2x² − 4x + 3: D = 16 − 24 = −8, so no real roots. For word problems (trains, areas, speeds), form the equation, discard any negative root that makes no physical sense, and state the answer in the context asked.' },
        ],
      },
    ],
  },
  {
    id: 'chem11-basic',
    classLevel: 'Class 11',
    subject: 'Chemistry',
    number: 1,
    title: 'Some Basic Concepts of Chemistry',
    summary: 'Mole concept, stoichiometry, empirical vs molecular formula, concentration terms.',
    concepts: [
      'Mole concept and Avogadro\'s number',
      'Empirical vs molecular formula',
      'Molarity, molality and mole fraction',
      'Stoichiometry and limiting reagent',
    ],
    pages: [
      {
        pageNumber: 1,
        heading: '1.1 The Mole Concept',
        blocks: [
          { type: 'text', text: 'One mole is the amount of substance containing as many elementary entities as atoms in exactly 12 g of carbon-12: Nₐ = 6.022 × 10²³ per mole. Molar mass in grams per mole connects mass to count: 4.4 g of CO₂ (M = 44 g/mol) is 0.1 mol, containing 0.1 × 6.022 × 10²³ molecules. At STP one mole of any ideal gas occupies 22.4 L — do not confuse this molar volume with Avogadro\'s number.' },
          { type: 'text', text: 'The molecular formula gives the actual number of atoms of each element; the empirical formula gives the simplest whole-number ratio. Glucose C₆H₁₂O₆ has empirical formula CH₂O. To find them from percentage composition: convert percent to grams (take 100 g), divide by atomic masses to get moles, then divide all by the smallest.' },
          { type: 'figure', caption: 'Fig. 1.1 — Mole map: mass ⇄ moles ⇄ particles ⇄ volume (gas at STP)', description: 'grams ÷ molar mass → moles; moles × Nₐ → particles; moles × 22.4 L → volume at STP.' },
        ],
      },
      {
        pageNumber: 2,
        heading: '1.2 Concentration Terms and Stoichiometry',
        blocks: [
          { type: 'text', text: 'Molarity M = moles of solute per litre of SOLUTION; molality m = moles of solute per kilogram of SOLVENT. Molality is preferred when temperature changes because volume (hence molarity) expands with heat while mass does not. Mole fraction is the ratio of one component\'s moles to total moles and is temperature-independent too.' },
          { type: 'text', text: 'Stoichiometry reads the balanced equation as a mole recipe. The limiting reagent — completely consumed first — fixes the maximum product; identify it by dividing each reactant\'s available moles by its coefficient and taking the smallest. Excess reagent remains afterwards. A classic 3-mark pattern: given masses of two reactants, find the limiting reagent, then the yield of product in moles and grams.' },
        ],
      },
    ],
  },
  {
    id: 'chem11-atom',
    classLevel: 'Class 11',
    subject: 'Chemistry',
    number: 2,
    title: 'Structure of Atom',
    summary: 'Quantum numbers, orbitals and shapes, electronic configuration, Aufbau/Hund/Pauli rules.',
    concepts: [
      'Quantum numbers and their meaning',
      'Shapes of s, p and d orbitals',
      'Aufbau principle and electronic configuration',
      'Hund\'s rule and Pauli exclusion principle',
    ],
    pages: [
      {
        pageNumber: 1,
        heading: '2.1 Quantum Numbers',
        blocks: [
          { type: 'text', text: 'Four quantum numbers specify an electron completely. The principal quantum number n gives the shell and size (energy mainly depends on it). The azimuthal quantum number l gives the subshell shape: l = 0 is s (spherical), l = 1 is p (dumbbell), l = 2 is d (clover). The magnetic quantum number m gives the orientation, running from −l to +l — so a p subshell has three orbitals, d has five. The spin quantum number s = ±½ distinguishes the two electrons an orbital can hold.' },
          { type: 'text', text: 'The Pauli exclusion principle: no two electrons in an atom share all four quantum numbers — hence an orbital holds at most two, with opposite spins. Hund\'s rule: in degenerate (equal-energy) orbitals, electrons occupy singly first with parallel spins before any pairing. Both rules explain why nitrogen\'s 2p³ is written with three single arrows, not one pair plus one.' },
          { type: 'figure', caption: 'Fig. 2.1 — Shapes of s, p and d orbitals', description: 's: sphere. p: two lobes along an axis (three orientations px, py, pz). d: four clover lobes plus the doughnut-shaped dz².' },
        ],
      },
      {
        pageNumber: 2,
        heading: '2.2 Building Electronic Configurations',
        blocks: [
          { type: 'text', text: 'The Aufbau principle fills orbitals in order of increasing (n + l); ties go to the lower n. The filling sequence runs 1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s 4f 5d 6p. So potassium is [Ar] 4s¹, not 3d¹. Chromium (Z = 24) is [Ar] 3d⁵ 4s¹ and copper (Z = 29) is [Ar] 3d¹⁰ 4s¹ — half-filled and fully-filled d subshells are extra stable, the classic exception boards ask about.' },
          { type: 'text', text: 'Write configurations by counting electrons into this order, then remember that for IONS, 4s electrons leave before 3d: Fe³⁺ is [Ar] 3d⁵ (not 3d³ 4s²). Board questions award separate marks for the correct order, the exception handling, and a correct orbital box diagram with Hund\'s rule arrows.' },
        ],
      },
    ],
  },
  {
    id: 'phy11-laws',
    classLevel: 'Class 11',
    subject: 'Physics',
    number: 4,
    title: 'Laws of Motion',
    summary: 'Newton\'s three laws, inertia, momentum, impulse, friction and circular motion dynamics.',
    concepts: [
      'Newton\'s first law and inertia',
      'Newton\'s second law: F = ma and momentum',
      'Newton\'s third law: action-reaction pairs',
      'Impulse and force-time graphs',
      'Friction: static and kinetic',
    ],
    pages: [
      {
        pageNumber: 1,
        heading: '4.1 The Three Laws',
        blocks: [
          { type: 'text', text: 'First law: a body continues in its state of rest or of uniform motion in a straight line unless compelled by a net external force. Inertia — the resistance to change of state — is measured by mass. The first law defines force qualitatively: force is the cause of acceleration, not of motion.' },
          { type: 'text', text: 'Second law: the rate of change of momentum is proportional to the applied force and takes place in its direction — F = dp/dt = ma for constant mass. Momentum p = mv, and a force of one newton gives a one-kilogram mass an acceleration of one metre per second squared. Third law: to every action there is an equal and opposite reaction — the pair always acts on TWO DIFFERENT bodies, which is exactly why they never cancel each other. A book on a table presses down; the table presses up on the book; the two forces of the pair act on different objects.' },
          { type: 'figure', caption: 'Fig. 4.1 — Action-reaction pair between a foot and a ball', description: 'Foot pushes ball forward (action on ball); ball pushes foot backward with equal force (reaction on foot).' },
        ],
      },
      {
        pageNumber: 2,
        heading: '4.2 Impulse and Friction',
        blocks: [
          { type: 'text', text: 'Impulse is the product of force and the short time it acts: J = FΔt = change in momentum Δp. A large force over a tiny interval (a bat hitting a ball) produces the same momentum change as a small force over a long time. On a force-time graph, impulse is the AREA under the curve — cricketers lower the hands while catching to stretch Δt and reduce the peak force, a two-mark favourite.' },
          { type: 'text', text: 'Friction opposes relative sliding. Static friction adjusts itself up to a maximum μ₍s₎N just before motion starts; once sliding begins, kinetic friction μ₍k₎N acts and is slightly smaller. It arises from interlocking of surface irregularities. Rolling reduces friction dramatically — the reason wheels and ball bearings exist. In circular motion on level ground, it is friction that supplies the centripetal force, capped at μ₍s₎mg.' },
        ],
      },
    ],
  },
  {
    id: 'cs11-mysql-dml',
    classLevel: 'Class 11',
    subject: 'Computer Science',
    number: 10,
    title: 'MySQL DML & Queries',
    summary: 'INSERT, SELECT with DISTINCT and aliases, WHERE operators, LIKE, IS NULL, UPDATE, DELETE, aggregate functions, GROUP BY and HAVING, joins.',
    concepts: [
      'INSERT INTO (full and partial rows)',
      'SELECT, DISTINCT and column aliases',
      'WHERE operators: BETWEEN, IN, LIKE, IS NULL',
      'UPDATE and DELETE semantics',
      'Aggregate functions and GROUP BY / HAVING',
      'Equi-join, INNER JOIN and NATURAL JOIN',
    ],
    pages: [
      {
        pageNumber: 1,
        heading: '10.1 DML: INSERT, UPDATE, DELETE',
        blocks: [
          { type: 'text', text: 'INSERT adds rows: a full-row insert lists values for every column in table order (INSERT INTO SPORTS VALUES (...)); a partial insert names the columns first and the omitted ones receive NULL or their DEFAULT. UPDATE changes existing values in place — UPDATE SPORTS SET FEE = FEE + 50 WHERE GAMENAME = \'Cricket\'; and DELETE removes whole rows — DELETE FROM SPORTS WHERE FEE IS NULL; Remember: without WHERE, UPDATE and DELETE touch EVERY row.' },
          { type: 'text', text: 'The structure-versus-data distinction is the highest-frequency board trap: INSERT/UPDATE/DELETE are DML (they change stored data and leave the schema intact); ALTER TABLE and DROP TABLE are DDL (they change the schema itself). DESC shows structure; SELECT shows data.' },
          { type: 'figure', caption: 'Fig. 10.1 — Effect of DELETE vs DROP TABLE', description: 'DELETE FROM empties the rows but the table skeleton remains; DROP TABLE removes rows AND the table definition from the catalog.' },
        ],
      },
      {
        pageNumber: 2,
        heading: '10.2 Queries: Filtering, Grouping and Joins',
        blocks: [
          { type: 'text', text: 'SELECT projects columns (with AS aliases), DISTINCT collapses duplicates, and WHERE filters rows: BETWEEN is inclusive on both bounds, IN matches a set, LIKE uses % (any run of characters) and _ (exactly one), and IS NULL is the only correct test for missing values — comparing with = NULL matches nothing, ever. Aggregates collapse rows: COUNT(*) counts every row including NULLs while COUNT(column) skips them; SUM, AVG, MAX, MIN ignore NULLs.' },
          { type: 'text', text: 'GROUP BY partitions rows per group so aggregates run inside each; HAVING filters those aggregated groups (WHERE cannot hold aggregates — it runs before grouping). Joins combine tables: the Cartesian product pairs every row with every row (degree adds, cardinality multiplies); an equi-join keeps the pairs where A.col = B.col; INNER JOIN … ON is the modern spelling; NATURAL JOIN automatically matches all same-named columns. Table aliases (EMPLOYEE E) keep long queries readable.' },
          { type: 'figure', caption: 'Fig. 10.2 — Two tables joined on DEPTNO', description: 'EMPLOYEE rows drawn to matching DEPT rows by arrow along DEPTNO; non-matching pairs dropped by the join.' },
        ],
      },
    ],
  },
  {
    id: 'phy11-motion',
    classLevel: 'Class 11',
    subject: 'Physics',
    number: 2,
    title: 'Motion in a Straight Line',
    summary: 'Position, path length and displacement, velocity and acceleration, kinematic equations, relative velocity.',
    concepts: [
      'Displacement vs distance',
      'Velocity and acceleration definitions',
      'Kinematic equations for uniform acceleration',
      'Position-time and velocity-time graphs',
      'Relative velocity',
    ],
    pages: [
      {
        pageNumber: 1,
        heading: '2.1 Position, Distance and Displacement',
        blocks: [
          { type: 'text', text: 'Motion is change of position with time, described relative to a chosen reference point (origin) and axis. Path length is the total ground covered — a scalar. Displacement is the change in position, x₂ − x₁ — a vector with both magnitude and direction. On a full round trip, path length can be large while displacement is zero; distance travelled is never less than the magnitude of displacement.' },
          { type: 'text', text: 'Average velocity is displacement over time interval; average speed is path length over time. Instantaneous velocity is the limit as the interval shrinks — the slope of the position–time graph. Speed is always non-negative; velocity carries sign. When velocity changes, acceleration a = Δv/Δt is nonzero: positive for speeding up along the chosen axis, negative (deceleration) for slowing.' },
          { type: 'figure', caption: 'Fig. 2.1 — Position-time graph for uniform motion', description: 'A straight line through (t₁, x₁) and (t₂, x₂); its slope equals the (constant) velocity.' },
        ],
      },
      {
        pageNumber: 2,
        heading: '2.2 Kinematic Equations and Relative Velocity',
        blocks: [
          { type: 'text', text: 'For constant acceleration along a line, three equations connect u, v, a, t and s: v = u + at; s = ut + ½at²; and the time-free relation v² = u² + 2as. These hold only for uniform acceleration. A useful shortcut: displacement in the nth second sₙ = u + (a/2)(2n − 1). Graphically, area under the velocity–time graph gives displacement, and its slope gives acceleration.' },
          { type: 'text', text: 'Relative velocity measures the velocity of A as seen from B: v_AB = v_A − v_B. Two trains on parallel tracks appear slower to each other when moving the same way — their relative speed is the difference — and head-on they close at the sum. Rain falling vertically appears slanted to a running observer: the observed velocity is the vector difference of rain velocity and the observer\'s velocity, a classic two-mark derivation in the board paper.' },
        ],
      },
    ],
  },
  {
    id: 'cs11-mysql-ddl',
    classLevel: 'Class 11',
    subject: 'Computer Science',
    number: 9,
    title: 'MySQL Basics & DDL',
    summary: 'Relational model, degree and cardinality, keys, CREATE TABLE with constraints, ALTER TABLE, DROP TABLE and DESC.',
    concepts: [
      'Degree and cardinality',
      'Candidate, primary, foreign and alternate keys',
      'CREATE TABLE with constraints',
      'CHAR vs VARCHAR and DECIMAL(M,D)',
      'ALTER TABLE and DROP TABLE',
    ],
    pages: [
      {
        pageNumber: 1,
        heading: '9.1 The Relational Model and Keys',
        blocks: [
          { type: 'text', text: 'A relation (table) stores data in rows (tuples) and columns (attributes). Degree is the number of columns; cardinality the number of rows. A candidate key is any set of attributes that can uniquely identify a tuple and never be NULL; the candidate key actually chosen is the primary key; the remaining candidates become alternate keys. A foreign key is a column in one table that references the primary key of another, enforcing referential integrity — a row cannot point at a parent that does not exist.' },
          { type: 'text', text: 'MySQL data types tested at board level: CHAR(n) is fixed length — shorter values are padded, longer truncated; VARCHAR(n) stores only what is used up to n. INT for whole numbers, FLOAT/DECIMAL(M,D) for decimals where M is total digits and D digits after the point, and DATE for calendar dates written \'YYYY-MM-DD\'.' },
          { type: 'figure', caption: 'Fig. 9.1 — STUDENT and SPORTS linked by a foreign key', description: 'STUDENT(ADMNO primary key) ← SPORTS.ADMNO foreign key; arrow from SPORTS.ADMNO to STUDENT.ADMNO.' },
        ],
      },
      {
        pageNumber: 2,
        heading: '9.2 CREATE, ALTER, DROP — and the Board Traps',
        blocks: [
          { type: 'text', text: 'CREATE TABLE defines structure and constraints in one statement: CREATE TABLE STUDENT (ADMNO CHAR(6) PRIMARY KEY, NAME VARCHAR(25) NOT NULL, CITY VARCHAR(15) DEFAULT \'Delhi\', MARKS DECIMAL(5,2)); Constraints: PRIMARY KEY (unique + not null), NOT NULL, UNIQUE, DEFAULT, and FOREIGN KEY … REFERENCES. DESC STUDENT shows the structure as Field | Type | Null | Key | Default | Extra.' },
          { type: 'text', text: 'ALTER TABLE changes structure: ADD COLUMN adds an attribute, MODIFY restates a column definition, DROP COLUMN removes one, ADD/DROP PRIMARY KEY moves the key. DROP TABLE destroys the entire relation. The classic board trap is mixing structure with data: UPDATE and DELETE change stored rows (DML); ALTER and DROP change the schema itself (DDL). Structure questions are graded on the statement shape, data questions on the rows affected.' },
        ],
      },
    ],
  },
  {
    id: 'eng11-writing',
    classLevel: 'Class 11',
    subject: 'English',
    number: 0,
    title: 'Grammar & Comprehension Skills',
    summary: 'Tenses, subject-verb agreement, reported speech, determiners and reading-comprehension strategy.',
    concepts: [
      'Tense consistency',
      'Subject-verb agreement',
      'Reported speech transformations',
      'Determiners and error correction',
      'Comprehension: inference and vocabulary in context',
    ],
    pages: [
      {
        pageNumber: 1,
        heading: 'Grammar that Boards Penalise',
        blocks: [
          { type: 'text', text: 'Subject–verb agreement: the verb agrees with the true subject, not the nearest noun. "Neither of the boys was present" — neither is singular. Collective nouns take singular verbs when acting as one unit. "Each", "every", "either" and "neither" are singular; two subjects joined by "or/nor" agree with the nearer one. Tense consistency keeps narration in one frame: a past narrative stays past unless the meaning demands otherwise.' },
          { type: 'text', text: 'Reported speech shifts: present → past ("I am writing" → he was writing), past → past perfect, will → would, can → could, and pronouns move to the reporter\'s viewpoint. Time markers shift too: now → then, today → that day, tomorrow → the next day. In comprehension, inference questions demand the answer implied by the text, not outside knowledge — quote the line that supports your answer and keep vocabulary answers to the meaning "as used here".' },
        ],
      },
      {
        pageNumber: 2,
        heading: 'Determiners, Error Correction and Comprehension Strategy',
        blocks: [
          { type: 'text', text: 'Determiners decide countability: fewer for countable plurals (fewer students), less for uncountables (less milk); much/many follow the same split. Error-correction lines in the paper usually hide one error per sentence — check the verb first (agreement and tense), then determiners, then preposition and article slips. Reading the sentence aloud often exposes the faulty one.' },
          { type: 'text', text: 'For the comprehension passage, read the questions BEFORE the second reading so you know what to hunt for. Answers must come from the passage: for inference, pick the option the text supports most directly; for vocabulary-in-context, replace the word with each option inside the same sentence and keep the meaning. Quote sparingly and always answer in a full sentence for two-mark questions.' },
        ],
      },
    ],
  },
]

export function getChapter(chapterId) {
  return NCERT_LIBRARY.find((c) => c.id === chapterId) || null
}

export function listLibrary() {
  // Group by class level then subject, including custom uploaded books
  let custom = []
  try {
    custom = JSON.parse(localStorage.getItem('studypulse-custom-books') || '[]')
  } catch { custom = [] }
  return [...NCERT_LIBRARY, ...custom]
}

export function getAnyChapter(chapterId) {
  return listLibrary().find((c) => c.id === chapterId) || null
}

export function addCustomBook({ title, subject, classLevel, pages }) {
  const custom = (() => {
    try { return JSON.parse(localStorage.getItem('studypulse-custom-books') || '[]') } catch { return [] }
  })()
  const id = `custom-${Date.now().toString(36)}`
  const book = {
    id,
    classLevel: classLevel || 'Custom',
    subject: subject || 'Custom PDF',
    number: 0,
    title: title || 'Uploaded chapter',
    summary: pages[0]?.blocks?.find((b) => b.type === 'text')?.text?.slice(0, 180) || 'Uploaded NCERT chapter.',
    concepts: [],
    custom: true,
    pages,
  }
  custom.push(book)
  localStorage.setItem('studypulse-custom-books', JSON.stringify(custom))
  return book
}
