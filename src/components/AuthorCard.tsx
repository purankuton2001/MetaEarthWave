import React, {useRef, VFC} from 'react';
import Image from 'next/image';
import {useLanguage} from '../hooks/useLanguage';
import {Icon} from '@chakra-ui/react';
import {AiFillTwitterCircle, AiOutlineInstagram} from 'react-icons/ai';
import Link from 'next/link';
import {useWindowSize} from '../hooks/useWindowSize';


export const AuthorCard: VFC<any> =
    ({name, profession, image, twitter, instagram}) => {
      const {width, height} = useWindowSize();
      return (
        <div className={'authorCardContainer'}>
          {image && <Image className={'authorCardImage'}
            src={image}
            width={width/4} height={height/4}
            objectFit={'contain'}/>
          }      <div className={'authorCardName'}>
            {name}
          </div>
          <div className={'authorCardProfession'}>
            {profession}
          </div>
          <div className={'snsIconList'}>
            {twitter && <a href={twitter} target={'_blank'}
              rel="noopener noreferrer">
              <Icon className={'snsIcon'}
                as={AiFillTwitterCircle}
                color={'skyblue'} width={width> 900 ? 16 : width/24}
                height={width> 900 ? 16 : width/24}/>
            </a>}
            {instagram && <a href={instagram} target={'_blank'}
              rel="noopener noreferrer">
              <Icon className={'snsIcon'}
                as={AiOutlineInstagram}
                color={'magenta'}
                width={width> 900 ? 16 : width/24}
                height={width> 900 ? 16 : width/24}/>
            </a>
            }
          </div>
        </div>
      );
    };

