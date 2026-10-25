<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" version="3.0" exclude-result-prefixes="#all">
    <xsl:output encoding="UTF-8" media-type="text/html" method="xhtml" version="1.0" indent="yes"
        omit-xml-declaration="yes"/>

    <xsl:import href="partials/tei-geo.xsl"/>
    <xsl:import href="partials/dataTable-base.xsl"/>
    <xsl:import href="partials/leaflet-base.xsl"/>
    <xsl:template match="/">
        <xsl:variable name="start" as="xs:int">
            <xsl:choose>
                <xsl:when test="
                        starts-with(
                        .//tei:title[@type = 'sub'][1]/text(),
                        'Tabelle 4')">
                    <xsl:value-of select="3"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:value-of select="0"/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="doc_title" select="'Inhaltsverzeichnis'"/>
        <div>
					<div class="bg-neutral-100">
            <h1 class="font-semibold p-4"> Gesamtbestand aller Kopisten </h1>
					</div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Quellenart</th>
                        <th>Ort</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    <xsl:for-each select="(for $uri in sort(uri-collection('../../data/editions?select=*.xml')) return doc($uri))//tei:TEI">
                        <xsl:variable name="full_path">
                            <xsl:value-of select="document-uri(/)"/>
                        </xsl:variable>
												<xsl:variable name="id" select="current()//tei:idno[@type='Bruckner_Kopisten']"/>
                        <xsl:variable name="personN">
                            <xsl:choose>
                                <xsl:when test=".//tei:persName[@subtype]">
                                    <xsl:value-of select="
                                            concat(
                                            .//tei:persName[@type = 'main']/text(),
                                            ' (',
                                            .//tei:persName/@subtype,
                                            ')')"/>
                                </xsl:when>
                                <xsl:when test="
                                        starts-with(
                                        .//tei:persName[@type = 'main']/text(),
                                        'Kopist')">
                                    <xsl:value-of
                                        select=".//tei:idno[@type = 'alphabetically_sorted']/text()"
                                    />
                                </xsl:when>
                                <xsl:otherwise>
                                    <xsl:value-of select=".//tei:persName[@type = 'main']/text()"/>
                                </xsl:otherwise>
                            </xsl:choose>
                        </xsl:variable>
                        <tr>
                            <td>
                                <xsl:value-of select="$personN"/>
                            </td>
                            <td>
                                <xsl:if test=".//tei:index/tei:term/text()">
                                    <xsl:value-of
                                        select=".//tei:index/tei:term[@xml:lang = 'de']/text()"/> |
                                        <xsl:value-of
                                        select=".//tei:index/tei:term[@xml:lang = 'eng']/text()"/>
                                </xsl:if>
                            </td>
                            <!-- <td>
                                                    <xsl:if test=".//tei:affiliation/text()">
                                                        <xsl:value-of select=".//tei:affiliation[@xml:lang='de']/text()"/> |
                                                        <xsl:value-of select=".//tei:affiliation[@xml:lang='eng']/text()"/>
                                                    </xsl:if>
                                                </td>-->
                            <td data-contenttype="place">
                                <xsl:if test=".//tei:listPlace">
                                    <xsl:variable name="latLong"
                                        select="tokenize(.//tei:listPlace/tei:place/tei:location/tei:geo/text(), ' ')"/>
                                    <xsl:variable name="lat" select="$latLong[1]"/>
                                    <xsl:variable name="long" select="$latLong[2]"/>
                                    <xsl:variable name="place"
                                        select=".//tei:listPlace/tei:place/tei:placeName/text()"/>
                                    <xsl:attribute name="data-lat">
                                        <xsl:value-of select="$lat"/>
                                    </xsl:attribute>
                                    <xsl:attribute name="data-lng">
                                        <xsl:value-of select="$long"/>
                                    </xsl:attribute>
                                    <xsl:attribute name="subtitle">
                                        <xsl:value-of select="concat($place, ': ', $personN)"/>
                                    </xsl:attribute>
                                    <xsl:attribute name="class">
                                        <xsl:text>map-coordinates</xsl:text>
                                    </xsl:attribute>
                                    <xsl:value-of select="$place"/>
                                </xsl:if>
                            </td>
                            <td>
                                <a>
                                    <xsl:attribute name="href">
                                        <xsl:value-of select="
                                                replace(
                                                tokenize($full_path, '/')[last()],
                                                '^.+$',
                                                $id)"/>
                                    </xsl:attribute>
                                    <xsl:attribute name="title">
                                        <xsl:value-of select="
                                                replace(
                                                tokenize($full_path, '/')[last()],
                                                '^.+$',
                                                $id)"/>
                                    </xsl:attribute>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                        fill="currentColor" class="bi bi-box-arrow-in-right"
                                        viewBox="0 0 16 16">
                                        <path fill-rule="evenodd"
                                            d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0v-2z"/>
                                        <path fill-rule="evenodd"
                                            d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"
                                        />
                                    </svg>
                                </a>
                            </td>
                        </tr>
                    </xsl:for-each>
                </tbody>
            </table>
        </div>

        <!--   <script src="js/one_leaflet_refactored.js"/>
                    <xsl:choose>
                        <xsl:when test="starts-with(
                            .//tei:title[@type='sub'][1]/text(),
                            'Tabelle 4')">
                            <script type="text/javascript"
                                src="js/dt-alphabet-filter-column3.js"></script>
                        </xsl:when>
                        <xsl:otherwise>
                            <script type="text/javascript"
                                src="js/dt-alphabet-filter.js"></script>
                        </xsl:otherwise>
                    </xsl:choose>
                </div>-->
    </xsl:template>
    <xsl:template match="tei:p">
        <p id="{generate-id()}">
            <xsl:apply-templates/>
        </p>
    </xsl:template>

    <xsl:template match="tei:list">
        <ul id="{generate-id()}">
            <xsl:apply-templates/>
        </ul>
    </xsl:template>

    <xsl:template match="tei:item">
        <li id="{generate-id()}">
            <xsl:apply-templates/>
        </li>
    </xsl:template>
    <xsl:template match="tei:ref">
        <xsl:choose>
            <xsl:when test="starts-with(data(@target), 'http')">
                <a>
                    <xsl:attribute name="href">
                        <xsl:value-of select="@target"/>
                    </xsl:attribute>
                    <xsl:value-of select="."/>
                </a>
            </xsl:when>
            <xsl:otherwise>
                <xsl:apply-templates/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
</xsl:stylesheet>
