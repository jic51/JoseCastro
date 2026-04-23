const QUESTIONS = [
  // NUMÉRICAS
  {
    id: 1, type: "numeric",
    es: { q: "¿Cuántos aguacates caben aproximadamente en un Tesla Model 3?", fact: "Un Tesla Model 3 tiene ~425 litros de espacio. Un aguacate promedio ocupa ~300 cm³. ¡Eso son ~1,400 aguacates!" },
    en: { q: "How many avocados fit approximately in a Tesla Model 3?", fact: "A Tesla Model 3 has ~425 liters of space. An average avocado takes ~300 cm³. That's about 1,400 avocados!" },
    simulatedAvg: 850, unit: ""
  },
  {
    id: 2, type: "choice",
    es: { q: "¿Qué prefiere la mayoría para desayunar los fines de semana?", options: ["Panqueques", "Huevos rancheros", "Cereal"], fact: "Los panqueques ganan en encuestas globales por un 12% de diferencia." },
    en: { q: "What does the majority prefer for weekend breakfast?", options: ["Pancakes", "Huevos Rancheros", "Cereal"], fact: "Pancakes win in global polls by a 12% margin." },
    simulatedDist: [58, 27, 15]
  },
  {
    id: 3, type: "numeric",
    es: { q: "¿Cuántos pasos da en promedio una persona en toda su vida? (en millones)", fact: "Si caminas 7,500 pasos diarios durante 80 años, acumulas ~219 millones de pasos." },
    en: { q: "How many steps does an average person take in their entire life? (in millions)", fact: "If you walk 7,500 steps daily for 80 years, you accumulate ~219 million steps." },
    simulatedAvg: 185, unit: "M"
  },
  {
    id: 4, type: "choice",
    es: { q: "Si tuvieras que elegir un superpoder, ¿cuál elegiría la mayoría?", options: ["Volar", "Teletransportarse", "Leer mentes"], fact: "Volar lidera desde 1938 en encuestas de superpoderes. La libertad de movimiento es universal." },
    en: { q: "If you had to pick a superpower, which would the majority choose?", options: ["Fly", "Teleport", "Read minds"], fact: "Flying has led since 1938 in superpower polls. Freedom of movement is universal." },
    simulatedDist: [52, 31, 17]
  },
  {
    id: 5, type: "numeric",
    es: { q: "¿Cuántos litros de café bebe en promedio una persona adulta al año?", fact: "El consumo mundial promedio es de ~4.5 kg de café al año. Eso equivale a unos 450 litros preparados." },
    en: { q: "How many liters of coffee does an average adult drink per year?", fact: "Global average consumption is ~4.5 kg of coffee per year. That's about 450 liters brewed." },
    simulatedAvg: 320, unit: "L"
  },
  {
    id: 6, type: "choice",
    es: { q: "¿Qué prefieren más las personas para relajarse?", options: ["Playa", "Montaña", "Ciudad"], fact: "La playa gana por un 23% globalmente, aunque la montaña domina en países sin costa." },
    en: { q: "What do people prefer most to relax?", options: ["Beach", "Mountains", "City"], fact: "Beach wins by 23% globally, though mountains dominate in landlocked countries." },
    simulatedDist: [54, 33, 13]
  },
  {
    id: 7, type: "numeric",
    es: { q: "¿Cuántas veces revisa el teléfono una persona promedio en un día?", fact: "Estudios de 2024 indican ~96 veces al día, o cada 10 minutos de vigilia." },
    en: { q: "How many times does an average person check their phone per day?", fact: "2024 studies indicate ~96 times per day, or every 10 minutes of wakefulness." },
    simulatedAvg: 88, unit: ""
  },
  {
    id: 8, type: "choice",
    es: { q: "¿Qué mascota elegiría la mayoría si no tuviera restricciones?", options: ["Perro", "Gato", "Dragón"], fact: "El dragón gana en encuestas hipotéticas por el factor 'cool', pero perro gana en la vida real." },
    en: { q: "Which pet would the majority choose with no restrictions?", options: ["Dog", "Cat", "Dragon"], fact: "Dragon wins hypothetical polls due to the 'cool' factor, but dogs win in real life." },
    simulatedDist: [41, 22, 37]
  },
  {
    id: 9, type: "numeric",
    es: { q: "¿Cuántos kilómetros mide la Gran Muralla China en total (incluyendo ramificaciones)?", fact: "El total histórico es de ~21,196 km. La sección construida durante la Dinastía Ming es de ~8,850 km." },
    en: { q: "How many kilometers long is the Great Wall of China in total (including branches)?", fact: "The total historic length is ~21,196 km. The Ming Dynasty section is ~8,850 km." },
    simulatedAvg: 12500, unit: "km"
  },
  {
    id: 10, type: "choice",
    es: { q: "¿Qué prefieren más para ver una película?", options: ["Sala de cine", "Sofá en casa", "Autocinema"], fact: "El sofá gana post-pandemia con un 64%, pero el cine sigue siendo rey para blockbusters." },
    en: { q: "What do people prefer most for watching a movie?", options: ["Movie theater", "Couch at home", "Drive-in"], fact: "The couch wins post-pandemic with 64%, but theaters remain king for blockbusters." },
    simulatedDist: [28, 64, 8]
  },
  {
    id: 11, type: "numeric",
    es: { q: "¿Cuántos años tiene el árbol más viejo del mundo aproximadamente?", fact: "El pino de bristlecone 'Methuselah' tiene ~4,854 años. Hay un bosque en Chile que podría superarlo." },
    en: { q: "How many years old is the oldest tree in the world approximately?", fact: "The bristlecone pine 'Methuselah' is ~4,854 years old. A forest in Chile might beat it." },
    simulatedAvg: 4200, unit: ""
  },
  {
    id: 12, type: "choice",
    es: { q: "¿Qué sabor de helado elegiría la mayoría?", options: ["Vainilla", "Chocolate", "Fresa"], fact: "La vainilla es el favorito mundial por su versatilidad, aunque el chocolate domina en encuestas de 'solo un sabor'." },
    en: { q: "Which ice cream flavor would the majority choose?", options: ["Vanilla", "Chocolate", "Strawberry"], fact: "Vanilla is the global favorite for versatility, though chocolate dominates 'single flavor' polls." },
    simulatedDist: [47, 41, 12]
  },
  {
    id: 13, type: "numeric",
    es: { q: "¿Cuántos metros mide la Torre Eiffel incluyendo la antena?", fact: "Mide 330 metros desde 2022, tras instalar una nueva antena digital. Originalmente tenía 312m." },
    en: { q: "How many meters tall is the Eiffel Tower including the antenna?", fact: "It measures 330 meters since 2022, after installing a new digital antenna. Originally it was 312m." },
    simulatedAvg: 310, unit: "m"
  },
  {
    id: 14, type: "choice",
    es: { q: "¿Qué prefieren más los humanos: amanecer o atardecer?", options: ["Amanecer", "Atardecer", "Medianoche"], fact: "El atardecer gana por un 68%. Los colores cálidos y el cierre del día generan más dopamina." },
    en: { q: "What do humans prefer more: sunrise or sunset?", options: ["Sunrise", "Sunset", "Midnight"], fact: "Sunset wins by 68%. Warm colors and the day's closure generate more dopamine." },
    simulatedDist: [22, 68, 10]
  },
  {
    id: 15, type: "numeric",
    es: { q: "¿Cuántos latidos da un corazón humano en toda una vida promedio? (en millones)", fact: "A 70 latidos por minuto durante 80 años, el corazón late ~2,940 millones de veces." },
    en: { q: "How many beats does a human heart make in an average lifetime? (in millions)", fact: "At 70 beats per minute for 80 years, the heart beats ~2,940 million times." },
    simulatedAvg: 2500, unit: "M"
  },
  {
    id: 16, type: "choice",
    es: { q: "Si solo pudieras comer una comida para siempre, ¿cuál elegiría la mayoría?", options: ["Pizza", "Sushi", "Tacos"], fact: "La pizza gana globalmente por su versatilidad. Hay más de 5,000 millones de pizzas vendidas al año." },
    en: { q: "If you could only eat one meal forever, which would the majority choose?", options: ["Pizza", "Sushi", "Tacos"], fact: "Pizza wins globally for versatility. Over 5 billion pizzas are sold per year." },
    simulatedDist: [55, 25, 20]
  },
  {
    id: 17, type: "numeric",
    es: { q: "¿Cuántos kilómetros cuadrados mide la ciudad de Tokio?", fact: "Tokio mide ~2,194 km². Es la metrópolis más poblada del mundo con ~37 millones de habitantes." },
    en: { q: "How many square kilometers is the city of Tokyo?", fact: "Tokyo measures ~2,194 km². It is the world's most populous metropolis with ~37 million people." },
    simulatedAvg: 1800, unit: "km²"
  },
  {
    id: 18, type: "choice",
    es: { q: "¿Qué medio de transporte elegiría la mayoría para un viaje de 500 km?", options: ["Avión", "Tren", "Auto"], fact: "El tren gana en Europa y Asia por comodidad. El avión domina en América por la falta de trenes de alta velocidad." },
    en: { q: "Which transport would the majority choose for a 500 km trip?", options: ["Plane", "Train", "Car"], fact: "Trains win in Europe and Asia for comfort. Planes dominate in America due to lack of high-speed rail." },
    simulatedDist: [35, 42, 23]
  },
  {
    id: 19, type: "numeric",
    es: { q: "¿Cuántos días pasan en Marte en un año marciano (en días terrestres)?", fact: "Un año marciano dura ~687 días terrestres. Los rover de la NASA usan 'sols' de 24h 39m." },
    en: { q: "How many Earth days are in a Martian year?", fact: "A Martian year lasts ~687 Earth days. NASA rovers use 'sols' of 24h 39m." },
    simulatedAvg: 650, unit: ""
  },
  {
    id: 20, type: "choice",
    es: { q: "¿Qué prefieren más las personas los viernes por la noche?", options: ["Salir de fiesta", "Netflix y sofá", "Dormir temprano"], fact: "Netflix y sofá gana con un 61%. La 'vida social' ha migrado digitalmente desde 2020." },
    en: { q: "What do people prefer most on Friday nights?", options: ["Party out", "Netflix & couch", "Sleep early"], fact: "Netflix & couch wins with 61%. Social life has migrated digitally since 2020." },
    simulatedDist: [24, 61, 15]
  },
  {
    id: 21, type: "numeric",
    es: { q: "¿Cuántas horas duerme en promedio una persona durante toda su vida?", fact: "A 8 horas diarias durante 80 años, dormimos ~233,600 horas. ¡Eso es ~26.6 años enteros!" },
    en: { q: "How many hours does an average person sleep in their entire life?", fact: "At 8 hours daily for 80 years, we sleep ~233,600 hours. That's ~26.6 full years!" },
    simulatedAvg: 200000, unit: "h"
  },
  {
    id: 22, type: "choice",
    es: { q: "¿Qué elegiría la mayoría si gana la lotería mañana?", options: ["Dejar el trabajo", "Seguir trabajando", "Emprender algo nuevo"], fact: "El 48% dejaría el trabajo inmediatamente. Solo el 12% seguiría en su empleo actual." },
    en: { q: "What would the majority choose if they won the lottery tomorrow?", options: ["Quit job", "Keep working", "Start something new"], fact: "48% would quit immediately. Only 12% would keep their current job." },
    simulatedDist: [48, 12, 40]
  },
  {
    id: 23, type: "numeric",
    es: { q: "¿Cuántos kilómetros mide la costa de Noruega (incluyendo fiordos)?", fact: "Con fiordos incluidos, mide ~100,915 km. Sin fiordos, solo ~2,650 km. Los fiordos multiplican la costa x38." },
    en: { q: "How many kilometers is Norway's coastline (including fjords)?", fact: "With fjords included, it measures ~100,915 km. Without fjords, only ~2,650 km. Fjords multiply the coast x38." },
    simulatedAvg: 45000, unit: "km"
  },
  {
    id: 24, type: "choice",
    es: { q: "¿Qué prefieren más: gatos o perros?", options: ["Perros", "Gatos", "Ambos por igual"], fact: "Globalmente los perros ganan 52% vs 37% gatos. Pero en internet, los gatos dominan por 10 a 1." },
    en: { q: "What do people prefer more: cats or dogs?", options: ["Dogs", "Cats", "Both equally"], fact: "Globally dogs win 52% vs 37% cats. But on the internet, cats dominate 10 to 1." },
    simulatedDist: [52, 37, 11]
  },
  {
    id: 25, type: "numeric",
    es: { q: "¿Cuántos caracteres tiene aproximadamente la novela 'Don Quijote de la Mancha'?", fact: "La edición original tiene ~1,050,000 caracteres. Fue la primera novela moderna occidental, publicada en 1605." },
    en: { q: "How many characters does the novel 'Don Quixote' approximately have?", fact: "The original edition has ~1,050,000 characters. It was the first modern Western novel, published in 1605." },
    simulatedAvg: 800000, unit: ""
  },
  {
    id: 26, type: "choice",
    es: { q: "¿Qué prefieren más las personas para recibir noticias?", options: ["Redes sociales", "Televisión", "Podcasts/Radio"], fact: "Redes sociales dominan con un 68% entre adultos jóvenes, aunque TV sigue siendo rey en 65+ años." },
    en: { q: "What do people prefer most for getting news?", options: ["Social media", "TV", "Podcasts/Radio"], fact: "Social media dominates with 68% among young adults, though TV remains king for 65+ years." },
    simulatedDist: [58, 28, 14]
  },
  {
    id: 27, type: "numeric",
    es: { q: "¿Cuántos huesos tiene un bebé humano al nacer?", fact: "Un bebé tiene ~270 huesos. Muchos se fusionan durante el crecimiento, dejando a los adultos con 206." },
    en: { q: "How many bones does a human baby have at birth?", fact: "A baby has ~270 bones. Many fuse during growth, leaving adults with 206." },
    simulatedAvg: 220, unit: ""
  },
  {
    id: 28, type: "choice",
    es: { q: "¿Qué prefieren más para una primera cita?", options: ["Cena romántica", "Café casual", "Actividad divertida (bowling, etc.)"], fact: "El café casual gana con un 47%. Menos presión, fácil escape si no hay química, y conversación real." },
    en: { q: "What do people prefer most for a first date?", options: ["Romantic dinner", "Casual coffee", "Fun activity (bowling, etc.)"], fact: "Casual coffee wins with 47%. Less pressure, easy escape if no chemistry, and real conversation." },
    simulatedDist: [31, 47, 22]
  },
  {
    id: 29, type: "numeric",
    es: { q: "¿Cuántos kilómetros recorre la luz en un segundo?", fact: "La luz viaja a ~299,792 km/s. Redondeado a 300,000 km/s para cálculos rápidos." },
    en: { q: "How many kilometers does light travel in one second?", fact: "Light travels at ~299,792 km/s. Rounded to 300,000 km/s for quick calculations." },
    simulatedAvg: 280000, unit: "km"
  },
  {
    id: 30, type: "choice",
    es: { q: "¿Qué prefieren más las personas para trabajar?", options: ["Oficina", "Remoto", "Híbrido"], fact: "El híbrido gana con un 52% globalmente. Ofrece flexibilidad sin perder el contacto humano." },
    en: { q: "What do people prefer most for working?", options: ["Office", "Remote", "Hybrid"], fact: "Hybrid wins with 52% globally. It offers flexibility without losing human contact." },
    simulatedDist: [18, 30, 52]
  }
];

function getQuestionForDate(date) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  return QUESTIONS[(dayOfYear - 1) % QUESTIONS.length];
}
