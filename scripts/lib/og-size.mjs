// Dimensões da imagem OG, em um módulo próprio porque duas partes precisam
// delas e não podem divergir. O gerador desenha nesse tamanho e o fan-out
// declara esse tamanho nas meta tags, e um scraper que recebe largura e
// altura declaradas monta o card sem precisar baixar e medir a imagem.
export const OG_WIDTH = 1200
export const OG_HEIGHT = 630
