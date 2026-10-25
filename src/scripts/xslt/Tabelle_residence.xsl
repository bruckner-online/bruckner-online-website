<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:a="http://relaxng.org/ns/compatibility/annotations/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:teidocx="http://www.tei-c.org/ns/teidocx/1.0"
    xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:rng="http://relaxng.org/ns/structure/1.0"
    xmlns:t="http://www.tei-c.org/ns/1.0" xmlns:teix="http://www.tei-c.org/ns/Examples"
    xmlns:html="http://www.w3.org/1999/xhtml" xmlns:m="http://www.music-encoding.org/ns/mei"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude"
    exclude-result-prefixes="#all" version="3.0">
    <xsl:output encoding="UTF-8" indent="yes"/>


    <xsl:function name="m:sort-by-place">
        <xsl:param name="eingabeliste"/>
        <xsl:perform-sort select="$eingabeliste">
            <xsl:sort select="//t:residence"/>
        </xsl:perform-sort>
    </xsl:function>


    <xsl:function name="m:sort-by-name">
        <xsl:param name="eingabeliste_2"/>
        <xsl:perform-sort select="$eingabeliste_2">
            <xsl:sort select="//t:idno[@type='alphabetically_sorted']"/>
        </xsl:perform-sort>
    </xsl:function>


    <xsl:template match="node() | @*" mode="inFile">
        <xsl:copy>
            <xsl:apply-templates mode="inFile" select="node() | @*"/>
        </xsl:copy>
    </xsl:template>
    <xsl:template match="t:TEI" exclude-result-prefixes="#all">
        <xsl:variable name="Person"
            select="(for $uri in sort(uri-collection('../../data/editions?select=*.xml;recurse=yes')) return doc($uri))/t:TEI/t:text/t:body/t:div"/>
        <TEI xmlns="http://www.tei-c.org/ns/1.0">
            <teiHeader>
                <fileDesc>
                    <titleStmt>
                        <title level="m">Die Wiener Kopisten der Werke Anton Bruckners</title>
                        <title type="sub" level="a">Tabelle 3 – Kopisten außerhalb Wiens</title>
                        <author>
                            <name>Paul Hawkshaw</name>
                            <name>Clemens Gubsch</name>
                        </author>
                        <respStmt>
                            <resp>Automatische Konvertierung nach TEI P5</resp>
                            <name xml:id="cg">Clemens Gubsch</name>
                        </respStmt>
                        <respStmt>
                            <resp>Dokumentvorbereitung, Korrektur und weiterführendes Markup</resp>
                            <name corresp="#cg">Clemens Gubsch</name>
                        </respStmt>
                    </titleStmt>
                    <editionStmt>
                        <edition>
                            <date>2020-11-01</date>
                        </edition>
                    </editionStmt>
                    <publicationStmt>
                        <publisher>XXX Project Name XXX</publisher>
                        <idno type="BrucknerKopisten"/>
                    </publicationStmt>
                    <sourceDesc>
                        <p>Erstellt unter Berücksichtigung des bisherigen Forschungsstandes.</p>
                    </sourceDesc>
                </fileDesc>
                <profileDesc>
                    <textClass>
                        <keywords>
                            <term>Tabelle</term>
                        </keywords>
                    </textClass>
                </profileDesc>
                <revisionDesc>
                    <listChange>
                        <change who="#cg" status="created">Erstellt und geprüft</change>
                    </listChange>
                </revisionDesc>
            </teiHeader>
            <text>
                <body>
                    <div>
                        <table>
                            <head xml:lang="de">Tabelle 3 – Kopisten der Werke Bruckners außerhalb
                                Wiens</head>
                            <head xml:lang="eng">Table 3 – Copyists of Bruckner’s Music Who Worked
                                outside Vienna</head>
                            <row xml:lang="de" role="label">
                                <cell>Ort</cell>
                                <cell>Kopisten</cell>
                            </row>
                            <row xml:lang="eng" role="label">
                                <cell>Location</cell>
                                <cell>Copyist</cell>
                            </row>

                            <xsl:for-each-group select="m:sort-by-place($Person)" group-by="t:listPerson/t:person/t:residence">
                                <xsl:variable name="placeID" select="concat('place_', generate-id())"/>
                                <xsl:choose>
                                    <xsl:when
                                        test="not(current()/t:listPerson/t:person/t:residence = '')">

                                        <xsl:if test="not(contains(., 'Wien')) and not(contains(., 'mult.'))">
                                            <row role="data">
                                                <cell role="Ort">
                                                    <rs type="place" ref="#place_1">
                                                        <xsl:choose>
                                                            <xsl:when test="current()/t:listPerson/t:person/t:residence/text() = 'St. Florian'">
                                                                <xsl:attribute name="ref">
                                                                    <xsl:text>#place_1</xsl:text>
                                                                </xsl:attribute>
                                                            </xsl:when>
                                                            <xsl:when test="current()/t:listPerson/t:person/t:residence/text() = 'Linz'">
                                                                <xsl:attribute name="ref">
                                                                    <xsl:text>#place_2</xsl:text>
                                                                </xsl:attribute>
                                                            </xsl:when>
                                                            <xsl:when test="current()/t:listPerson/t:person/t:residence/text() = 'Kremsmünster'">
                                                                <xsl:attribute name="ref">
                                                                    <xsl:text>#place_3</xsl:text>
                                                                </xsl:attribute>
                                                            </xsl:when>
                                                            <xsl:when test="current()/t:listPerson/t:person/t:residence/text() = 'Steyr'">
                                                                <xsl:attribute name="ref">
                                                                    <xsl:text>#place_4</xsl:text>
                                                                </xsl:attribute>
                                                            </xsl:when>
                                                            <xsl:when test="current()/t:listPerson/t:person/t:residence/text() = 'Klosterneuburg'">
                                                                <xsl:attribute name="ref">
                                                                    <xsl:text>#place_5</xsl:text>
                                                                </xsl:attribute>
                                                            </xsl:when>
                                                            <xsl:when test="current()/t:listPerson/t:person/t:residence/text() = 'Vöcklabruck'">
                                                                <xsl:attribute name="ref">
                                                                    <xsl:text>#place_6</xsl:text>
                                                                </xsl:attribute>
                                                            </xsl:when>
                                                            <xsl:when test="current()/t:listPerson/t:person/t:residence/text() = 'Salzburg'">
                                                                <xsl:attribute name="ref">
                                                                    <xsl:text>#place_7</xsl:text>
                                                                </xsl:attribute>
                                                            </xsl:when>
                                                            <xsl:when test="current()/t:listPerson/t:person/t:residence/text() = 'Traun'">
                                                                <xsl:attribute name="ref">
                                                                    <xsl:text>#place_8</xsl:text>
                                                                </xsl:attribute>
                                                            </xsl:when>
                                                            <xsl:when test="current()/t:listPerson/t:person/t:residence/text() = 'Straßburg'">
                                                                <xsl:attribute name="ref">
                                                                    <xsl:text>#place_9</xsl:text>
                                                                </xsl:attribute>
                                                            </xsl:when>
                                                            <xsl:when test="current()/t:listPerson/t:person/t:residence/text() = 'Hörsching'">
                                                                <xsl:attribute name="ref">
                                                                    <xsl:text>#place_10</xsl:text>
                                                                </xsl:attribute>
                                                            </xsl:when>
                                                            <xsl:otherwise>

                                                            </xsl:otherwise>
                                                        </xsl:choose>
                                                        <xsl:value-of select="current()/t:listPerson/t:person/t:residence"/>
                                                    </rs>
                                                </cell>
                                                <cell role="Kopisten">
                                                  <xsl:for-each select="m:sort-by-name(current-group()/t:listPerson/t:person)">
                                                      <xsl:variable name="cp-cleaning1" select="
                                                          replace(
                                                          replace(
                                                          replace(
                                                          replace(
                                                          replace(
                                                          replace(
                                                          translate(./t:persName[@type='main'] ,' ', '-')
                                                          , ',', '')
                                                          ,'ß', 'ss')
                                                          , '[éè]', 'e')
                                                          , 'ä', 'a')
                                                          , 'ö', 'o')
                                                          , 'ü', 'u')
                                                          "/>
                                                      <xsl:variable name="cp-cleaning2" select="data(translate($cp-cleaning1,'.', ''))"/>
                                                      <xsl:variable name="cp-clean" select="translate($cp-cleaning2, '&#xA0;', '-') => lower-case()"/>
                                                      <xsl:element name="ref">
                                                          <xsl:attribute name="corresp">
                                                              <xsl:value-of select="//t:div/@xml:id"/>
                                                          </xsl:attribute>
                                                          <xsl:attribute name="target">
                                                              <xsl:value-of
                                                                  select="concat('data/editions/', $cp-clean, '.xml')"/>
                                                          </xsl:attribute>
                                                          <xsl:choose>
                                                              <xsl:when test="
                                                                  starts-with(./t:persName[@type = 'main'], 'Kopist')">
                                                                  <persName type="main"><xsl:value-of select="./t:idno[@type='alphabetically_sorted']"/></persName>
                                                              </xsl:when>
                                                              <xsl:when test=".//t:persName[@subtype]">
                                                                  <persName type="main">
                                                                      <xsl:value-of select="concat(
                                                                          .//t:persName[@type='main']/text(),
                                                                          ' (',.//t:persName/@subtype, ')')"/>
                                                                  </persName>
                                                              </xsl:when>
                                                              <xsl:otherwise>
                                                                  <xsl:copy-of select="./t:persName[@type='main']"/>
                                                              </xsl:otherwise>
                                                          </xsl:choose>
                                                      </xsl:element>
                                                  </xsl:for-each>
                                                </cell>
                                            </row>
                                        </xsl:if>
                                    </xsl:when>
                                </xsl:choose>
                            </xsl:for-each-group>
                        </table>
                    </div>
                </body>
                <back>
                    <listPlace>
                        <place xml:id="place_1">
                            <placeName>St. Florian</placeName>
                            <location>
                                <geo>48.205680000000 14.378360000000</geo>
                            </location>
                            <idno subtype="geonames" type="URL">https://www.geonames.org/2771867</idno>
                        </place>
                        <place xml:id="place_2">
                            <placeName>Linz</placeName>
                            <location>
                                <geo>48.306390000000 14.286110000000</geo>
                            </location>
                            <idno subtype="geonames" type="URL">https://www.geonames.org/2772400</idno>
                        </place>
                        <place xml:id="place_3">
                            <placeName>Kremsmünster</placeName>
                            <location>
                                <geo>48.052900000000 14.129190000000</geo>
                            </location>
                            <idno subtype="geonames" type="URL">https://www.geonames.org/2773538</idno>
                        </place>
                        <place xml:id="place_4">
                            <placeName>Steyr</placeName>
                            <location>
                                <geo>48.033330000000 14.416670000000</geo>
                            </location>
                            <idno subtype="geonames" type="URL">https://www.geonames.org/2764347</idno>
                        </place>
                        <place xml:id="place_5">
                            <placeName>Klosterneuburg</placeName>
                            <location>
                                <geo>48.305210000000 16.325220000000</geo>
                            </location>
                            <idno subtype="geonames" type="URL">https://www.geonames.org/2773913</idno>
                        </place>
                        <place xml:id="place_6">
                            <placeName>Vöcklabruck</placeName>
                            <location>
                                <geo>48.003130000000 13.657720000000</geo>
                            </location>
                            <idno subtype="geonames" type="URL">https://www.geonames.org/2762342</idno>
                        </place>
                        <place xml:id="place_7">
                            <placeName>Salzburg</placeName>
                            <location>
                                <geo>47.800670000000 13.045320000000</geo>
                            </location>
                            <idno subtype="geonames" type="URL">https://www.geonames.org/2766818</idno>
                        </place>
                        <place xml:id="place_8">
                            <placeName>Traun</placeName>
                            <location>
                                <geo>48.220860000000 14.238330000000</geo>
                            </location>
                            <idno subtype="geonames" type="URL">https://www.geonames.org/2763423</idno>
                        </place>
                        <place xml:id="place_9">
                            <placeName>Straßburg</placeName>
                            <location>
                                <geo>48.583610000000 7.748060000000</geo>
                            </location>
                            <idno subtype="geonames" type="URL">https://www.geonames.org/6441375</idno>
                        </place>
                        <place xml:id="place_10">
                            <placeName>Hörsching</placeName>
                            <location>
                                <geo>48.226270000000 14.177860000000</geo>
                            </location>
                            <idno subtype="geonames" type="URL">https://www.geonames.org/2775497</idno>
                        </place>
                    </listPlace>
                </back>
            </text>
        </TEI>
    </xsl:template>

</xsl:stylesheet>
