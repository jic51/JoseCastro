const QUESTIONS = [
  {
    id: 1, type: "numeric",
    es: { q: "¿Cuántos aguacates caben aproximadamente en un Tesla Model 3?", fact: "Un Tesla Model 3 tiene ~425 litros de espacio de carga. Un aguacate Hass promedio ocupa unos 300 cm³. Haciendo las cuentas, caben aproximadamente 1,400 aguacates. El Model 3 fue diseñado por Franz von Holzhausen y lanzado en 2017. Es el vehículo eléctrico más vendido de la historia, superando los 3 millones de unidades. Su diseño minimalista eliminó casi todos los botones físicos, usando una pantalla táctil de 15 pulgadas como centro de control." },
    en: { q: "How many avocados fit approximately in a Tesla Model 3?", fact: "A Tesla Model 3 has ~425 liters of cargo space. A Hass avocado averages about 300 cm³. That means roughly 1,400 avocados fit inside. The Model 3 was designed by Franz von Holzhausen and launched in 2017. It is the best-selling electric vehicle in history, with over 3 million units sold. Its minimalist design eliminated almost all physical buttons, using a 15-inch touchscreen as the control center." },
    simulatedAvg: 850, unit: ""
  },
  {
    id: 2, type: "choice",
    es: { q: "¿Qué prefiere la mayoría para desayunar los fines de semana?", options: ["Panqueques", "Huevos rancheros", "Cereal"], fact: "Los panqueques ganan en encuestas globales por un 12% de diferencia sobre los huevos. Esta tradición viene de la antigua Grecia, donde se servían con miel y queso. En Estados Unidos, el Día Nacional del Panqueque se celebra el 25 de septiembre. Los panqueques son universales: los franceses los llaman crêpes, los rusos blini, y los japoneses hotcakes. Su versatilidad (dulces o salados) los hace irresistibles para el brunch dominical." },
    en: { q: "What does the majority prefer for weekend breakfast?", options: ["Pancakes", "Huevos Rancheros", "Cereal"], fact: "Pancakes win in global polls by a 12% margin over eggs. This tradition dates back to ancient Greece, where they were served with honey and cheese. In the United States, National Pancake Day is celebrated on September 25. Pancakes are universal: the French call them crêpes, Russians blini, and Japanese hotcakes. Their versatility (sweet or savory) makes them irresistible for Sunday brunch." },
    simulatedDist: [58, 27, 15]
  },
  {
    id: 3, type: "numeric",
    es: { q: "¿Cuántos pasos da en promedio una persona en toda su vida? (en millones)", fact: "Si caminas 7,500 pasos diarios durante 80 años, acumulas ~219 millones de pasos. Eso equivale a dar la vuelta al mundo 4.3 veces (considerando la circunferencia terrestre de 40,075 km). El récord Guinness de más pasos en un día lo tiene un británico que caminó 116,000 pasos en 24 horas. Caminar 10,000 pasos al día reduce un 30% el riesgo de enfermedades cardíacas, según estudios de la Universidad de Harvard." },
    en: { q: "How many steps does an average person take in their entire life? (in millions)", fact: "If you walk 7,500 steps daily for 80 years, you accumulate ~219 million steps. That is equivalent to walking around the world 4.3 times (considering Earth's circumference of 40,075 km). The Guinness record for most steps in a day belongs to a Briton who walked 116,000 steps in 24 hours. Walking 10,000 steps a day reduces heart disease risk by 30%, according to Harvard University studies." },
    simulatedAvg: 185, unit: "M"
  },
  {
    id: 4, type: "choice",
    es: { q: "Si tuvieras que elegir un superpoder, ¿cuál elegiría la mayoría?", options: ["Volar", "Teletransportarse", "Leer mentes"], fact: "Volar lidera desde 1938 en encuestas de superpoderes. La libertad de movimiento es un deseo universal que aparece en mitos de todas las culturas: Ícaro en Grecia, el Hombre Volador en Perú, y Garuda en la India. Superman, creado en 1938 por Jerry Siegel y Joe Shuster, consolidó volar como el superpoder por excelencia. Teletransportarse gana entre personas con ansiedad social, mientras que leer mentes es el más temido (nadie quiere que lean sus pensamientos)." },
    en: { q: "If you had to pick a superpower, which would the majority choose?", options: ["Fly", "Teleport", "Read minds"], fact: "Flying has led since 1938 in superpower polls. Freedom of movement is a universal desire appearing in myths across all cultures: Icarus in Greece, the Flying Man in Peru, and Garuda in India. Superman, created in 1938 by Jerry Siegel and Joe Shuster, cemented flying as the ultimate superpower. Teleportation wins among people with social anxiety, while mind-reading is the most feared (nobody wants their thoughts read)." },
    simulatedDist: [52, 31, 17]
  },
  {
    id: 5, type: "numeric",
    es: { q: "¿Cuántos litros de café bebe en promedio una persona adulta al año?", fact: "El consumo mundial promedio es de ~4.5 kg de café al año, lo que equivale a unos 450 litros preparados. Finlandia lidera el consumo con 12 kg per cápita anual. La leyenda del café nació en Etiopía hace ~1,000 años, cuando un pastor llamado Kaldi notó que sus cabras no dormían después de comer bayas de café. Hoy existen más de 100 especies de café, pero solo Arabica y Robusta dominisan el 99% del mercado mundial." },
    en: { q: "How many liters of coffee does an average adult drink per year?", fact: "Global average consumption is ~4.5 kg of coffee per year, equivalent to about 450 liters brewed. Finland leads consumption with 12 kg per capita annually. The coffee legend was born in Ethiopia ~1,000 years ago, when a shepherd named Kaldi noticed his goats didn't sleep after eating coffee berries. Today there are over 100 coffee species, but only Arabica and Robusta dominate 99% of the world market." },
    simulatedAvg: 320, unit: "L"
  },
  {
    id: 6, type: "choice",
    es: { q: "¿Qué prefieren más las personas para relajarse?", options: ["Playa", "Montaña", "Ciudad"], fact: "La playa gana por un 23% globalmente, aunque la montaña domina en países sin costa como Suiza y Austria. El efecto 'Blue Mind' descubierto por el biólogo marino Wallace J. Nichols demuestra que estar cerca del agua reduce el cortisol (hormona del estrés) en un 20%. Las montañas, por su parte, ofrecen 'forest bathing' o shinrin-yoku, una práctica japonesa con 40 años de evidencia científica sobre reducción de presión arterial." },
    en: { q: "What do people prefer most to relax?", options: ["Beach", "Mountains", "City"], fact: "Beach wins by 23% globally, though mountains dominate in landlocked countries like Switzerland and Austria. The 'Blue Mind' effect discovered by marine biologist Wallace J. Nichols proves that being near water reduces cortisol (stress hormone) by 20%. Mountains, meanwhile, offer 'forest bathing' or shinrin-yoku, a Japanese practice with 40 years of scientific evidence on blood pressure reduction." },
    simulatedDist: [54, 33, 13]
  },
  {
    id: 7, type: "numeric",
    es: { q: "¿Cuántas veces revisa el teléfono una persona promedio en un día?", fact: "Estudios de 2024 indican ~96 veces al día, o cada 10 minutos de vigilia. Los millennials lideran con 150 veces diarias. Esta conducta se llama 'nomofobia' (miedo a estar sin móvil) y fue identificada por primera vez en 2008. El récord de adicción al teléfono lo tiene una adolescente de Florida que envió 24,000 mensajes en un mes. Las notificaciones están diseñadas con psicología variable (como las tragamonedas) para maximizar la dopamina y la revisión compulsiva." },
    en: { q: "How many times does an average person check their phone per day?", fact: "2024 studies indicate ~96 times per day, or every 10 minutes of wakefulness. Millennials lead with 150 daily checks. This behavior is called 'nomophobia' (fear of being without a phone) and was first identified in 2008. The phone addiction record belongs to a Florida teenager who sent 24,000 messages in one month. Notifications are designed with variable psychology (like slot machines) to maximize dopamine and compulsive checking." },
    simulatedAvg: 88, unit: ""
  },
  {
    id: 8, type: "choice",
    es: { q: "¿Qué mascota elegiría la mayoría si no tuviera restricciones?", options: ["Perro", "Gato", "Dragón"], fact: "El dragón gana en encuestas hipotéticas por el factor 'cool', pero perro gana en la vida real con un 63% de preferencia global. Los perros fueron domesticados hace ~15,000 años en Asia Central, haciéndolos los primeros animales domesticados por humanos. Los gatos se domesticaron ~9,500 años en el Cercano Oriente. Curiosamente, en internet los gatos dominan: hay 6.5 billones de vistas en videos de gatos vs 4.2 de perros. La gente quiere dragones por poder, pero necesita perros por compañía." },
    en: { q: "Which pet would the majority choose with no restrictions?", options: ["Dog", "Cat", "Dragon"], fact: "Dragon wins hypothetical polls due to the 'cool' factor, but dogs win in real life with 63% global preference. Dogs were domesticated ~15,000 years ago in Central Asia, making them the first animals domesticated by humans. Cats were domesticated ~9,500 years ago in the Near East. Curiously, on the internet cats dominate: there are 6.5 billion views on cat videos vs 4.2 billion for dogs. People want dragons for power, but need dogs for companionship." },
    simulatedDist: [41, 22, 37]
  },
  {
    id: 9, type: "numeric",
    es: { q: "¿Cuántos kilómetros mide la Gran Muralla China en total (incluyendo ramificaciones)?", fact: "El total histórico es de ~21,196 km. La sección construida durante la Dinastía Ming (1368-1644) es de ~8,850 km. Contrariamente a la creencia popular, NO es visible desde el espacio con ojo humano. Su construcción comenzó en el siglo VII a.C. y duró más de 2,000 años. Se estima que murieron ~1 millón de trabajadores durante su construcción. En 1987 fue declarada Patrimonio de la Humanidad por la UNESCO. El mortero usado en algunas secciones contenía arroz pegajoso como adhesivo." },
    en: { q: "How many kilometers long is the Great Wall of China in total (including branches)?", fact: "The total historic length is ~21,196 km. The section built during the Ming Dynasty (1368-1644) is ~8,850 km. Contrary to popular belief, it is NOT visible from space with the naked eye. Construction began in the 7th century BC and lasted over 2,000 years. An estimated ~1 million workers died during its construction. In 1987 it was declared a UNESCO World Heritage Site. The mortar used in some sections contained sticky rice as an adhesive." },
    simulatedAvg: 12500, unit: "km"
  },
  {
    id: 10, type: "choice",
    es: { q: "¿Qué prefieren más para ver una película?", options: ["Sala de cine", "Sofá en casa", "Autocinema"], fact: "El sofá gana post-pandemia con un 64%, pero el cine sigue siendo rey para blockbusters. La primera sala de cine comercial fue la Gran Café de París en 1895, de los hermanos Lumière. El autocinema nació en 1933 en Nueva Jersey por Richard Hollingshead Jr., quien colocó un proyector en el capó de su coche. Netflix, fundado en 1997 como servicio de renta de DVDs por correo, ahora tiene 260 millones de suscriptores y ha transformado por completo la industria cinematográfica." },
    en: { q: "What do people prefer most for watching a movie?", options: ["Movie theater", "Couch at home", "Drive-in"], fact: "The couch wins post-pandemic with 64%, but theaters remain king for blockbusters. The first commercial movie theater was the Grand Café in Paris in 1895, by the Lumière brothers. The drive-in was born in 1933 in New Jersey by Richard Hollingshead Jr., who placed a projector on his car hood. Netflix, founded in 1997 as a DVD rental-by-mail service, now has 260 million subscribers and has completely transformed the film industry." },
    simulatedDist: [28, 64, 8]
  },
  {
    id: 11, type: "numeric",
    es: { q: "¿Cuántos años tiene el árbol más viejo del mundo aproximadamente?", fact: "El pino de bristlecone 'Methuselah' tiene ~4,854 años y vive en las Montañas Blancas de California. Fue descubierto por el dendrocronólogo Edmund Schulman en 1953. Su ubicación exacta es secreta para protegerlo de vandalismo. En 2022, científicos chilenos descubrieron un ciprés de Patagonia que podría tener 5,400 años, desafiando el récord. Estos árboles sobreviven a 3,000 metros de altitud con vientos de 160 km/h y temperaturas de -30°C. Un anillo de crecimiento representa un año completo de historia climática." },
    en: { q: "How many years old is the oldest tree in the world approximately?", fact: "The bristlecone pine 'Methuselah' is ~4,854 years old and lives in California's White Mountains. It was discovered by dendrochronologist Edmund Schulman in 1953. Its exact location is secret to protect it from vandalism. In 2022, Chilean scientists discovered a Patagonian cypress that might be 5,400 years old, challenging the record. These trees survive at 3,000 meters altitude with 160 km/h winds and -30°C temperatures. One growth ring represents a complete year of climate history." },
    simulatedAvg: 4200, unit: ""
  },
  {
    id: 12, type: "choice",
    es: { q: "¿Qué sabor de helado elegiría la mayoría?", options: ["Vainilla", "Chocolate", "Fresa"], fact: "La vainilla es el favorito mundial por su versatilidad, aunque el chocolate domina en encuestas de 'solo un sabor'. La vainilla proviene de una orquídea (Vanilla planifolia) originaria de México, cultivada por los totonacos desde el siglo XV. El chocolate helado fue inventado en 1692 en Napoles, Italia. La fresa, aunque popular, solo representa el 8% del mercado. Thomas Jefferson tenía una receta de helado de vainilla de 1780, una de las más antiguas de Estados Unidos." },
    en: { q: "Which ice cream flavor would the majority choose?", options: ["Vanilla", "Chocolate", "Strawberry"], fact: "Vanilla is the global favorite for versatility, though chocolate dominates 'single flavor' polls. Vanilla comes from an orchid (Vanilla planifolia) native to Mexico, cultivated by the Totonacs since the 15th century. Chocolate ice cream was invented in 1692 in Naples, Italy. Strawberry, while popular, only represents 8% of the market. Thomas Jefferson had a vanilla ice cream recipe from 1780, one of the oldest in the United States." },
    simulatedDist: [47, 41, 12]
  },
  {
    id: 13, type: "numeric",
    es: { q: "¿Cuántos metros mide la Torre Eiffel incluyendo la antena?", fact: "Mide 330 metros desde 2022, tras instalar una nueva antena digital DAB+. Originalmente tenía 312m cuando Gustave Eiffel la inauguró en 1889 para la Exposición Universal de París. Se construyó en 2 años, 2 meses y 5 días con 18,000 piezas de hierro y 2.5 millones de remaches. Durante el verano el hierro se expande y crece 15 cm de altura. Fue criticada como 'monstruosidad' por artistas de la época, incluyendo Guy de Maupassant, quien comía allí porque era el único lugar de París desde donde no se veía la torre." },
    en: { q: "How many meters tall is the Eiffel Tower including the antenna?", fact: "It measures 330 meters since 2022, after installing a new DAB+ digital antenna. Originally it was 312m when Gustave Eiffel inaugurated it in 1889 for the Paris Universal Exposition. It was built in 2 years, 2 months and 5 days with 18,000 iron pieces and 2.5 million rivets. During summer the iron expands and it grows 15 cm taller. It was criticized as a 'monstrosity' by artists of the time, including Guy de Maupassant, who ate there because it was the only place in Paris from where the tower couldn't be seen." },
    simulatedAvg: 310, unit: "m"
  },
  {
    id: 14, type: "choice",
    es: { q: "¿Qué prefieren más los humanos: amanecer o atardecer?", options: ["Amanecer", "Atardecer", "Medianoche"], fact: "El atardecer gana por un 68%. Los colores cálidos (naranjas, rojos, violetas) generan más dopamina porque evolucionamos para asociarlos con el descanso seguro después de la caza. El amanecer, aunque hermoso, requiere despertarse temprano, algo que la mayoría evita. El fenómeno óptico que crea los colores del atardecer se llama 'dispersión de Rayleigh', descubierta por Lord Rayleigh en 1871. En los polos, el sol puede tardar horas en ponerse completamente, creando 'noches blancas' de atardecer eterno." },
    en: { q: "What do humans prefer more: sunrise or sunset?", options: ["Sunrise", "Sunset", "Midnight"], fact: "Sunset wins by 68%. Warm colors (oranges, reds, purples) generate more dopamine because we evolved to associate them with safe rest after hunting. Sunrise, while beautiful, requires waking up early, which most people avoid. The optical phenomenon that creates sunset colors is called 'Rayleigh scattering,' discovered by Lord Rayleigh in 1871. At the poles, the sun can take hours to fully set, creating 'white nights' of eternal sunset." },
    simulatedDist: [22, 68, 10]
  },
  {
    id: 15, type: "numeric",
    es: { q: "¿Cuántos latidos da un corazón humano en toda una vida promedio? (en millones)", fact: "A 70 latidos por minuto durante 80 años, el corazón late ~2,940 millones de veces. Es el músculo más trabajado del cuerpo: nunca descansa desde antes de nacer hasta la muerte. El corazón de una ballena azul, el animal más grande de la historia, late solo 8 veces por minuto. El de un colibrí, 1,200 veces por minuto. El primer marcapasos artificial fue implantado en 1958 por el doctor Åke Senning en Suecia, y duró solo 3 horas antes de fallar. Hoy, los marcapasos modernos duran 10-15 años." },
    en: { q: "How many beats does a human heart make in an average lifetime? (in millions)", fact: "At 70 beats per minute for 80 years, the heart beats ~2,940 million times. It is the hardest-working muscle in the body: it never rests from before birth until death. A blue whale's heart, the largest animal in history, beats only 8 times per minute. A hummingbird's beats 1,200 times per minute. The first artificial pacemaker was implanted in 1958 by Dr. Åke Senning in Sweden, and lasted only 3 hours before failing. Today, modern pacemakers last 10-15 years." },
    simulatedAvg: 2500, unit: "M"
  },
  {
    id: 16, type: "choice",
    es: { q: "Si solo pudieras comer una comida para siempre, ¿cuál elegiría la mayoría?", options: ["Pizza", "Sushi", "Tacos"], fact: "La pizza gana globalmente por su versatilidad. Hay más de 5,000 millones de pizzas vendidas al año en el mundo. La pizza moderna nació en Nápoles, Italia, en 1889, cuando el pizzaiolo Raffaele Espósito creó la 'Pizza Margherita' para honrar a la reina Margarita con los colores de la bandera italiana. El sushi, aunque milenario en Japón, solo se hizo popular globalmente en los años 1980. Los tacos prehispánicos mexicanos datan de hace 2,000 años. Pizza = universalidad." },
    en: { q: "If you could only eat one meal forever, which would the majority choose?", options: ["Pizza", "Sushi", "Tacos"], fact: "Pizza wins globally for versatility. Over 5 billion pizzas are sold per year worldwide. Modern pizza was born in Naples, Italy, in 1889, when pizzaiolo Raffaele Espósito created 'Pizza Margherita' to honor Queen Margherita with the colors of the Italian flag. Sushi, although millennia-old in Japan, only became globally popular in the 1980s. Mexican pre-Hispanic tacos date back 2,000 years. Pizza = universality." },
    simulatedDist: [55, 25, 20]
  },
  {
    id: 17, type: "numeric",
    es: { q: "¿Cuántos kilómetros cuadrados mide la ciudad de Tokio?", fact: "Tokio mide ~2,194 km². Es la metrópolis más poblada del mundo con ~37 millones de habitantes en su área metropolitana. Antes llamada Edo, fue renombrada Tokio ('capital del este') en 1868 cuando el emperador Meiji trasladó la capital desde Kioto. Tiene el sistema de transporte público más eficiente del mundo: 13 millones de personas usan el metro diariamente con una puntualidad del 99.9%. El cruce de Shibuya es el más transitado del planeta, con hasta 3,000 personas cruzando simultáneamente en cada cambio de luz." },
    en: { q: "How many square kilometers is the city of Tokyo?", fact: "Tokyo measures ~2,194 km². It is the world's most populous metropolis with ~37 million people in its metropolitan area. Formerly called Edo, it was renamed Tokyo ('eastern capital') in 1868 when Emperor Meiji moved the capital from Kyoto. It has the world's most efficient public transport system: 13 million people use the subway daily with 99.9% punctuality. Shibuya Crossing is the planet's busiest intersection, with up to 3,000 people crossing simultaneously at each light change." },
    simulatedAvg: 1800, unit: "km²"
  },
  {
    id: 18, type: "choice",
    es: { q: "¿Qué medio de transporte elegiría la mayoría para un viaje de 500 km?", options: ["Avión", "Tren", "Auto"], fact: "El tren gana en Europa y Asia por comodidad y sostenibilidad. El récord de velocidad ferroviaria lo tiene el tren maglev japonés L0 Series con 603 km/h en 2015. El avión domina en América por la falta de trenes de alta velocidad: EE.UU. tiene solo 735 km de vías de alta velocidad vs 45,000 km en China. El auto, aunque flexible, es el menos eficiente: emite 171g de CO2 por pasajero-km vs 41g del tren eléctrico. El primer vuelo comercial fue en 1914 entre Tampa y St. Petersburg, Florida, durando 23 minutos." },
    en: { q: "Which transport would the majority choose for a 500 km trip?", options: ["Plane", "Train", "Car"], fact: "Trains win in Europe and Asia for comfort and sustainability. The rail speed record belongs to Japan's L0 Series maglev at 603 km/h in 2015. Planes dominate in America due to lack of high-speed rail: the US has only 735 km of high-speed track vs 45,000 km in China. Cars, while flexible, are least efficient: emitting 171g CO2 per passenger-km vs 41g for electric trains. The first commercial flight was in 1914 between Tampa and St. Petersburg, Florida, lasting 23 minutes." },
    simulatedDist: [35, 42, 23]
  },
  {
    id: 19, type: "numeric",
    es: { q: "¿Cuántos días pasan en Marte en un año marciano (en días terrestres)?", fact: "Un año marciano dura ~687 días terrestres. Los rover de la NASA usan 'sols' de 24h 39m. Marte fue nombrado por los romanos en honor a su dios de la guerra por su color rojizo (óxido de hierro). El día más largo del Sistema Solar lo tiene Venus con 243 días terrestres. El año más corto es el de Mercurio con solo 88 días terrestres. El primer aterrizaje exitoso en Marte fue Viking 1 en 1976. Perseverance, el rover más reciente, ha estado recogiendo muestras para una futura misión de retorno a la Tierra prevista para 2033." },
    en: { q: "How many Earth days are in a Martian year?", fact: "A Martian year lasts ~687 Earth days. NASA rovers use 'sols' of 24h 39m. Mars was named by the Romans after their god of war for its reddish color (iron oxide). The longest day in the Solar System belongs to Venus at 243 Earth days. The shortest year is Mercury's at just 88 Earth days. The first successful Mars landing was Viking 1 in 1976. Perseverance, the most recent rover, has been collecting samples for a future return mission to Earth planned for 2033." },
    simulatedAvg: 650, unit: ""
  },
  {
    id: 20, type: "choice",
    es: { q: "¿Qué prefieren más las personas los viernes por la noche?", options: ["Salir de fiesta", "Netflix y sofá", "Dormir temprano"], fact: "Netflix y sofá gana con un 61%. La 'vida social' ha migrado digitalmente desde 2020. Netflix, fundada en 1997 como servicio de renta de DVDs, ahora produce 1,000 títulos originales al año y tiene 260 millones de suscriptores. El término 'Netflix and chill' se volvió meme en 2014 y ahora es código cultural para quedarse en casa. Dormir temprano ha ganado popularidad entre la Generación Z como forma de 'self-care'. Los viernes son el día con más tráfico en apps de delivery de comida a domicilio." },
    en: { q: "What do people prefer most on Friday nights?", options: ["Party out", "Netflix & couch", "Sleep early"], fact: "Netflix & couch wins with 61%. Social life has migrated digitally since 2020. Netflix, founded in 1997 as a DVD rental service, now produces 1,000 original titles per year and has 260 million subscribers. The term 'Netflix and chill' became a meme in 2014 and is now cultural code for staying home. Sleeping early has gained popularity among Gen Z as a form of 'self-care.' Fridays are the day with the most traffic on food delivery apps." },
    simulatedDist: [24, 61, 15]
  },
  {
    id: 21, type: "numeric",
    es: { q: "¿Cuántas horas duerme en promedio una persona durante toda su vida?", fact: "A 8 horas diarias durante 80 años, dormimos ~233,600 horas. ¡Eso es ~26.6 años enteros! El récord de insomnio más largo documentado pertenece a Randy Gardner, quien estuvo despierto 264 horas (11 días) en 1965 como experimento escolar. Las personas que duermen menos de 6 horas tienen 4 veces más riesgo de accidente cerebrovascular. Los delfines duermen con un hemisferio del cerebro a la vez para no ahogarse. La posición fetal es la más común entre humanos (41%), un instinto evolutivo de protección de órganos vitales." },
    en: { q: "How many hours does an average person sleep in their entire life?", fact: "At 8 hours daily for 80 years, we sleep ~233,600 hours. That's ~26.6 full years! The longest documented insomnia record belongs to Randy Gardner, who stayed awake 264 hours (11 days) in 1965 as a school experiment. People who sleep less than 6 hours have 4 times higher stroke risk. Dolphins sleep with one brain hemisphere at a time so they don't drown. The fetal position is the most common among humans (41%), an evolutionary instinct to protect vital organs." },
    simulatedAvg: 200000, unit: "h"
  },
  {
    id: 22, type: "choice",
    es: { q: "¿Qué elegiría la mayoría si gana la lotería mañana?", options: ["Dejar el trabajo", "Seguir trabajando", "Emprender algo nuevo"], fact: "El 48% dejaría el trabajo inmediatamente. Solo el 12% seguiría en su empleo actual. Estudios de psicología muestran que el 70% de los ganadores de lotería pierden su fortuna en 5 años. Jack Whittaker, quien ganó $315 millones en 2002, terminó en bancarrota y con su nieta fallecida por sobredosis. Por el contrario, Brad Duke, ganador de $220 millones en 2005, invirtió todo y triplicó su dinero en 10 años. El dinero no compra felicidad, pero la autonomía sí: emprender tiene la satisfacción más alta a largo plazo." },
    en: { q: "What would the majority choose if they won the lottery tomorrow?", options: ["Quit job", "Keep working", "Start something new"], fact: "48% would quit immediately. Only 12% would keep their current job. Psychology studies show that 70% of lottery winners lose their fortune within 5 years. Jack Whittaker, who won $315 million in 2002, ended up bankrupt with his granddaughter dead from overdose. Conversely, Brad Duke, winner of $220 million in 2005, invested everything and tripled his money in 10 years. Money doesn't buy happiness, but autonomy does: entrepreneurship has the highest long-term satisfaction." },
    simulatedDist: [48, 12, 40]
  },
  {
    id: 23, type: "numeric",
    es: { q: "¿Cuántos kilómetros mide la costa de Noruega (incluyendo fiordos)?", fact: "Con fiordos incluidos, mide ~100,915 km. Sin fiordos, solo ~2,650 km. Los fiordos multiplican la costa x38. Este fenómeno se conoce como 'paradoja de la costa': cuanto más zoom haces en una costa irregular, más larga se vuelve. Los fiordos noruegos fueron formados por glaciares durante la última era de hielo hace 10,000 años. El Sognefjord es el más largo y profundo (204 km de largo, 1,308 m de profundidad). Noruega tiene la segunda costa más larga del mundo después de Canadá, a pesar de ser un país relativamente pequeño." },
    en: { q: "How many kilometers is Norway's coastline (including fjords)?", fact: "With fjords included, it measures ~100,915 km. Without fjords, only ~2,650 km. Fjords multiply the coast x38. This phenomenon is known as the 'coastline paradox': the more you zoom into an irregular coast, the longer it becomes. Norwegian fjords were formed by glaciers during the last ice age 10,000 years ago. The Sognefjord is the longest and deepest (204 km long, 1,308 m deep). Norway has the second-longest coastline in the world after Canada, despite being a relatively small country." },
    simulatedAvg: 45000, unit: "km"
  },
  {
    id: 24, type: "choice",
    es: { q: "¿Qué prefieren más: gatos o perros?", options: ["Perros", "Gatos", "Ambos por igual"], fact: "Globalmente los perros ganan 52% vs 37% gatos. Pero en internet, los gatos dominan por 10 a 1. El primer meme de gato fue en 2006 ('I Can Has Cheezburger?'). Los perros entienden ~165 palabras humanas (equivalente a un niño de 2 años), mientras que los gatos entienden ~35 pero eligen ignorarlas. Los perros tienen 300 millones de receptores olfativos vs 80 millones de los gatos. Curiosamente, los dueños de gatos tienen un 30% menos de probabilidad de sufrir infarto, según un estudio de la Universidad de Minnesota." },
    en: { q: "What do people prefer more: cats or dogs?", options: ["Dogs", "Cats", "Both equally"], fact: "Globally dogs win 52% vs 37% cats. But on the internet, cats dominate 10 to 1. The first cat meme was in 2006 ('I Can Has Cheezburger?'). Dogs understand ~165 human words (equivalent to a 2-year-old child), while cats understand ~35 but choose to ignore them. Dogs have 300 million olfactory receptors vs 80 million in cats. Curiously, cat owners have a 30% lower chance of heart attack, according to a University of Minnesota study." },
    simulatedDist: [52, 37, 11]
  },
  {
    id: 25, type: "numeric",
    es: { q: "¿Cuántos caracteres tiene aproximadamente la novela 'Don Quijote de la Mancha'?", fact: "La edición original tiene ~1,050,000 caracteres. Fue la primera novela moderna occidental, publicada en 1605 por Miguel de Cervantes. Se considera la obra más traducida después de la Biblia, con versiones en 60 idiomas. Cervantes escribió parte de ella en prisión en Sevilla por deudas. La frase 'Luchar contra molinos de viento' proviene de esta novela y significa pelear contra enemigos imaginarios. William Faulkner dijo que leería el libro 'como si acabara de escribirlo el hombre que lo escribió'." },
    en: { q: "How many characters does the novel 'Don Quixote' approximately have?", fact: "The original edition has ~1,050,000 characters. It was the first modern Western novel, published in 1605 by Miguel de Cervantes. It is considered the most translated work after the Bible, with versions in 60 languages. Cervantes wrote part of it in prison in Seville for debts. The phrase 'Tilting at windmills' comes from this novel and means fighting imaginary enemies. William Faulkner said he would read the book 'as if the man who wrote it had just finished it.'" },
    simulatedAvg: 800000, unit: ""
  },
  {
    id: 26, type: "choice",
    es: { q: "¿Qué prefieren más las personas para recibir noticias?", options: ["Redes sociales", "Televisión", "Podcasts/Radio"], fact: "Redes sociales dominan con un 68% entre adultos jóvenes, aunque TV sigue siendo rey en 65+ años. El algoritmo de TikTok puede detectar tus intereses en 40 minutos de uso. La radio, inventada por Guglielmo Marconi en 1895, sigue siendo el medio más confiable durante desastres naturales. Los podcasts crecieron un 500% desde 2014, con 464 millones de oyentes globales. Sin embargo, el 62% de las noticias virales en redes contienen alguna distorsión o desinformación, según estudios de MIT." },
    en: { q: "What do people prefer most for getting news?", options: ["Social media", "TV", "Podcasts/Radio"], fact: "Social media dominates with 68% among young adults, though TV remains king for 65+ years. TikTok's algorithm can detect your interests in 40 minutes of use. Radio, invented by Guglielmo Marconi in 1895, remains the most reliable medium during natural disasters. Podcasts grew 500% since 2014, with 464 million global listeners. However, 62% of viral news on social media contains some distortion or misinformation, according to MIT studies." },
    simulatedDist: [58, 28, 14]
  },
  {
    id: 27, type: "numeric",
    es: { q: "¿Cuántos huesos tiene un bebé humano al nacer?", fact: "Un bebé tiene ~270 huesos. Muchos se fusionan durante el crecimiento, dejando a los adultos con 206. El hueso más pequeño es el estribo en el oído medio (2.8 mm). El más largo es el fémur. Los bebés nacen sin rótulas (se forman entre los 2 y 6 años). Los dientes no son huesos, aunque parecen similares: carecen de médula ósea y no se regeneran. El esqueleto humano representa solo el 14% del peso corporal pero soporta 30 veces su propio peso en presión." },
    en: { q: "How many bones does a human baby have at birth?", fact: "A baby has ~270 bones. Many fuse during growth, leaving adults with 206. The smallest bone is the stapes in the middle ear (2.8 mm). The longest is the femur. Babies are born without kneecaps (they form between ages 2 and 6). Teeth are not bones, though they look similar: they lack bone marrow and don't regenerate. The human skeleton represents only 14% of body weight but supports 30 times its own weight in pressure." },
    simulatedAvg: 220, unit: ""
  },
  {
    id: 28, type: "choice",
    es: { q: "¿Qué prefieren más para una primera cita?", options: ["Cena romántica", "Café casual", "Actividad divertida (bowling, etc.)"], fact: "El café casual gana con un 47%. Menos presión, fácil escape si no hay química, y conversación real. La psicóloga Arthur Aron demostró que 36 preguntas específicas pueden generar intimidad entre desconocidos en 45 minutos. Las actividades divertidas ganan entre la Generación Z porque reducen la ansiedad del 'entrevista laboral' que representa una cena formal. El peor lugar para primera cita según estudios: el cine (no se habla). El mejor: un mercado de comida o feria." },
    en: { q: "What do people prefer most for a first date?", options: ["Romantic dinner", "Casual coffee", "Fun activity (bowling, etc.)"], fact: "Casual coffee wins with 47%. Less pressure, easy escape if no chemistry, and real conversation. Psychologist Arthur Aron demonstrated that 36 specific questions can generate intimacy between strangers in 45 minutes. Fun activities win among Gen Z because they reduce the 'job interview' anxiety of a formal dinner. The worst place for a first date according to studies: the movies (no talking). The best: a food market or fair." },
    simulatedDist: [31, 47, 22]
  },
  {
    id: 29, type: "numeric",
    es: { q: "¿Cuántos kilómetros recorre la luz en un segundo?", fact: "La luz viaja a ~299,792 km/s. Redondeado a 300,000 km/s para cálculos rápidos. Albert Einstein estableció en 1905 que nada puede superar esta velocidad. A esa velocidad, podrías dar 7.5 vueltas a la Tierra en un segundo. La luz del Sol tarda 8 minutos 20 segundos en llegar a nosotros. Si el Sol explotara ahora, no lo sabríamos hasta dentro de 8 minutos. La luz más lenta jamás registrada fue de 61 km/h, lograda en un laboratorio de Harvard en 1999 enfriando átomos de sodio a casi cero absoluto." },
    en: { q: "How many kilometers does light travel in one second?", fact: "Light travels at ~299,792 km/s. Rounded to 300,000 km/s for quick calculations. Albert Einstein established in 1905 that nothing can exceed this speed. At that speed, you could circle Earth 7.5 times in one second. Sunlight takes 8 minutes 20 seconds to reach us. If the Sun exploded now, we wouldn't know for 8 minutes. The slowest light ever recorded was 61 km/h, achieved at a Harvard lab in 1999 by cooling sodium atoms to near absolute zero." },
    simulatedAvg: 280000, unit: "km"
  },
  {
    id: 30, type: "choice",
    es: { q: "¿Qué prefieren más las personas para trabajar?", options: ["Oficina", "Remoto", "Híbrido"], fact: "El híbrido gana con un 52% globalmente. Ofrece flexibilidad sin perder el contacto humano. El trabajo remoto masivo comenzó en 2020 por la pandemia, pero estudios de Stanford muestran que el remoto aumenta la productividad un 13%. Sin embargo, la soledad es el problema #1: el 67% de trabajadores remotos reportan aislamiento. Las oficinas tradicionales solo ganan entre ejecutivos mayores de 50 años. Empresas como Google y Apple exigen 3 días presenciales, mientras que Airbnb y Dropbox son 100% remotos. El futuro es híbrido." },
    en: { q: "What do people prefer most for working?", options: ["Office", "Remote", "Hybrid"], fact: "Hybrid wins with 52% globally. It offers flexibility without losing human contact. Mass remote work began in 2020 due to the pandemic, but Stanford studies show remote work increases productivity by 13%. However, loneliness is the #1 problem: 67% of remote workers report isolation. Traditional offices only win among executives over 50. Companies like Google and Apple require 3 in-person days, while Airbnb and Dropbox are 100% remote. The future is hybrid." },
    simulatedDist: [18, 30, 52]
  }
];

function getQuestionForDate(date) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  return QUESTIONS[(dayOfYear - 1) % QUESTIONS.length];
}